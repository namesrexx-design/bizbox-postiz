require('reflect-metadata');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { Module, createParamDecorator } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { loadTypeScript, root } = require('./load-typescript.cjs');
const prisma = 'libraries/nestjs-libraries/src/database/prisma/';
const content = loadTypeScript('libraries/helpers/src/utils/sanitize.post.content.ts');
const { PostsService } = loadTypeScript(prisma + 'posts/posts.service.ts', {
  '@gitroom/helpers/utils/sanitize.post.content': content,
});
const { PostsRepository } = loadTypeScript(prisma + 'posts/posts.repository.ts');
const { IntegrationRepository } = loadTypeScript(prisma + 'integrations/integration.repository.ts');
const orgDecorator = { GetOrgFromRequest: createParamDecorator(() => ({ id: 'org-a' })) };
const { IntegrationsController } = loadTypeScript('apps/backend/src/api/routes/integrations.controller.ts', {
  '@gitroom/nestjs-libraries/user/org.from.request': orgDecorator,
});
const { PublicIntegrationsController } = loadTypeScript('apps/backend/src/public-api/routes/v1/public.integrations.controller.ts');
const { PublicController } = loadTypeScript('apps/backend/src/api/routes/public.controller.ts');
const { IntegrationListTool } = loadTypeScript('libraries/nestjs-libraries/src/chat/tools/integration.list.tool.ts', {
  '@gitroom/nestjs-libraries/chat/auth.context': { checkAuth() {} },
});
const object = (Class, members) => Object.assign(Object.create(Class.prototype), members);
const integration = { id: 'channel-a', name: 'Provider name', providerIdentifier: 'linkedin', postingTimes: '[]', additionalSettings: '[]', token: 'synthetic-private', refreshToken: 'synthetic-private-refresh' };
const row = (id, group, channel = 'channel-a') => ({ id, group, integrationId: channel, integration, parentPostId: null, settings: '{}', image: '[]', content: 'same text', publishDate: new Date('2030-01-01T10:00:00Z'), state: 'DRAFT' });

test('generated client omits only the two absent fields and retains scorer batch metadata', () => {
  const { Prisma } = require('@prisma/client');
  const models = Prisma.dmmf.datamodel.models;
  assert.ok(!models.find(m => m.name === 'Integration').fields.some(f => f.name === 'customName'));
  assert.ok(!models.find(m => m.name === 'Post').fields.some(f => f.name === 'batchId'));
  assert.ok(models.find(m => m.name === 'mastra_scorers').fields.some(f => f.name === 'batchId'));
  const schema = readFileSync(path.join(root, prisma, 'schema.prisma'), 'utf8');
  const scorer = schema.match(/model mastra_scorers \{[\s\S]*?\n\}/)[0];
  assert.match(scorer, /batchId\s+String\?/);
  assert.equal(scorer, readFileSync(path.join(__dirname, 'mastra-scorers.prisma'), 'utf8').trim());
});

test('rename HTTP route rejects before touching any service or repository', async t => {
  let calls = 0;
  const unavailable = { updateCustomName() { calls++; throw new Error('Unexpected service access'); } };
  class TestModule {}
  const types = Reflect.getMetadata('design:paramtypes', IntegrationsController);
  Module({ controllers: [IntegrationsController], providers: types.map(provide => ({ provide, useValue: unavailable })) })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false, abortOnError: false });
  await app.listen(0, '127.0.0.1');
  t.after(() => app.close());
  const base = await app.getUrl();
  for (const name of ['New name', '']) {
    const response = await fetch(base + '/integrations/channel-a/custom-name', {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }),
    });
    assert.equal(response.status, 501);
    assert.match((await response.json()).message, /renaming is unavailable/);
  }
  assert.equal(calls, 0);
  assert.equal(typeof IntegrationRepository.prototype.updateCustomName, 'undefined');
});

test('integration lists retain provider name and omit private tokens', async () => {
  const requests = [];
  const service = { getIntegrationsList: async org => { requests.push(org); return [integration]; } };
  const controller = object(IntegrationsController, {
    _integrationService: service, _integrationManager: { getSocialIntegration: () => ({ editor: 'normal' }) },
  });
  const list = (await controller.getIntegrationList({ id: 'org-a' })).integrations;
  assert.equal(list[0].name, 'Provider name');
  assert.equal(list[0].originalName, 'Provider name');
  assert.equal(list[0].token, undefined);
  const tool = new IntegrationListTool(service).run();
  const result = await tool.execute({}, { requestContext: { get: () => '{"id":"org-a"}' } });
  assert.equal(result.output[0].name, 'Provider name');
  assert.equal(result.output[0].token, undefined);
  assert.deepEqual(requests, ['org-a', 'org-a']);
});

test('editor loads only the requested org/group and never infers siblings', async () => {
  const calls = [];
  const rows = [row('one', 'group-a'), { ...row('two', 'group-a'), parentPostId: 'one' }, row('other-channel', 'group-b', 'channel-b')];
  const repo = object(PostsRepository, { _post: { model: { post: { findMany: async args => {
    calls.push(args); return rows.filter(p => p.group === args.where.group);
  } } } } });
  const service = object(PostsService, { _postRepository: repo });
  const result = await service.getPostsByGroup('org-a', 'group-a');
  assert.deepEqual(calls.map(c => c.where), [{ group: 'group-a', organizationId: 'org-a', deletedAt: null }]);
  assert.deepEqual(result.posts.map(p => p.id), ['one', 'two']);
  assert.deepEqual(result.siblings, []);
  assert.equal(result.integration, 'channel-a');
  assert.equal(result.posts[0].integration.token, undefined);
  assert.equal(result.posts[0].integration.refreshToken, undefined);
  assert.equal(typeof PostsRepository.prototype.getPostsByBatch, 'undefined');
  await assert.rejects(service.getPostsByGroup('org-a', 'missing'), e => e.getStatus() === 404);
});

function repositoryFixture() {
  const calls = { upsert: [], updateMany: [], findFirst: [] };
  const model = {
    async upsert(args) { calls.upsert.push(args); return { ...args.create, id: args.where.id }; },
    async findFirst(args) { calls.findFirst.push(args); return { id: 'prior-root' }; },
    async updateMany(args) { calls.updateMany.push(args); return { count: 1 }; },
  };
  return { calls, repo: object(PostsRepository, {
    _post: { model: { post: model } }, _tagsPosts: { model: { tagsPosts: { deleteMany: async () => {} } } },
  }) };
}
const postBody = () => ({ integration: { id: 'channel-a' }, settings: { __type: 'linkedin', visibility: 'public' }, value: [{ id: 'root', content: 'main', image: [] }, { id: 'comment', content: 'reply', image: [], delay: 20 }] });

test('post create/update keeps thread, channel, date and settings without batch payloads', async () => {
  const { repo, calls } = repositoryFixture();
  const body = postBody();
  const result = await repo.createOrUpdatePost('schedule', 'org-a', '2030-01-01T10:00:00Z', body, [], 'UI');
  assert.equal(result.posts.length, 2);
  for (const query of calls.upsert) {
    for (const data of [query.create, query.update]) {
      assert.deepEqual(data.integration.connect, { id: 'channel-a', organizationId: 'org-a' });
      assert.deepEqual(data.organization.connect, { id: 'org-a' });
      assert.equal(data.publishDate.toISOString(), '2030-01-01T10:00:00.000Z');
      assert.equal(data.settings, JSON.stringify(body.settings));
      assert.equal(data.state, 'QUEUE');
      assert.ok(!Object.hasOwn(data, 'batchId'));
    }
  }
  assert.deepEqual(calls.upsert[1].create.parentPost.connect, { id: 'root' });
  assert.equal(calls.findFirst.length, 0);
  assert.equal(calls.updateMany.length, 0);
});

test('keepGroup sweeps dropped comments while rotated edit stays in its own group', async () => {
  for (const keepGroup of [false, true]) {
    const { repo, calls } = repositoryFixture();
    const body = { ...postBody(), group: 'group-a' };
    await repo.createOrUpdatePost('update', 'org-a', '2030-01-01T10:00:00Z', body, [], 'UI', 3, keepGroup);
    const data = calls.upsert[0].update;
    assert.equal(data.intervalInDays, 3);
    assert.ok(!Object.hasOwn(data, 'state'), 'update does not republish');
    assert.equal(data.group === 'group-a', keepGroup);
    assert.equal(calls.updateMany.length, 1);
    assert.equal(calls.updateMany[0].where.group, 'group-a');
    assert.equal(calls.updateMany[0].where.deletedAt, null);
    if (keepGroup) assert.deepEqual(calls.updateMany[0].where.id.notIn, ['root', 'comment']);
    assert.doesNotMatch(JSON.stringify(calls), /batchId/);
  }
});

test('multi-channel save retains each date/settings and workflow/anchor calls', async () => {
  const calls = [], workflows = [], anchors = [];
  const service = object(PostsService, {
    _integrationManager: { getSocialIntegration: () => ({}) },
    _postRepository: { createOrUpdatePost: async (...args) => {
      calls.push(args); return { posts: [{ ...row(args[3].value[0].id, 'a'), state: 'QUEUE' }] };
    } },
    startWorkflow: async (...args) => workflows.push(args),
    detachStaleAnchors: async posts => anchors.push(posts),
  });
  const body = { type: 'schedule', date: '2030-01-01T10:00:00Z', tags: [], republish: true, posts: [
    { ...postBody(), date: '2030-02-01T10:00:00Z' },
    { ...postBody(), integration: { id: 'channel-b' }, settings: { __type: 'youtube', private: true } },
  ] };
  const result = await service.createPost('org-a', body, 'UI', true);
  assert.deepEqual(result.map(p => p.integration), ['channel-a', 'channel-b']);
  assert.deepEqual(calls.map(c => [c[1], c[2], c[3].integration.id, c[7]]), [
    ['org-a', '2030-02-01T10:00:00Z', 'channel-a', true], ['org-a', body.date, 'channel-b', true],
  ]);
  assert.equal(calls[1][3].settings.private, true);
  assert.ok(calls.every(c => c.length === 8));
  assert.equal(workflows.length, 2);
  assert.equal(anchors.length, 2);
  calls.length = workflows.length = anchors.length = 0;
  await service.createPost('org-a', { ...body, type: 'update' }, 'UI', true);
  assert.equal(calls.length, 2);
  assert.equal(workflows.length, 0, 'update never starts publication');
  assert.equal(anchors.length, 2);
});

test('published post guard still rejects schedule before saving without republish opt-in', async () => {
  let saved = false;
  const service = object(PostsService, { _postRepository: {
    getPostById: async (id, org) => { assert.equal(org, 'org-a'); return { ...row(id, 'a'), state: 'PUBLISHED' }; },
    createOrUpdatePost: async () => { saved = true; },
  } });
  await assert.rejects(service.createPost('org-a', { type: 'schedule', posts: [postBody()] }, 'UI'), /already published/);
  assert.equal(saved, false);
});

test('public preview and release-id response preserve existing safe field filtering', async () => {
  const post = { ...row('one', 'a'), childrenPost: [{ id: 'child' }] };
  const controller = object(PublicController, { _postsService: { getPostsRecursively: async () => [post] } });
  const result = await controller.getPreview('one');
  assert.equal(result[0].childrenPost, undefined);
  assert.equal(result[0].integration.token, undefined);
  assert.equal(result[0].integration.refreshToken, undefined);
  assert.equal(result[0].integration.name, 'Provider name');
  const releaseCalls = [];
  const publicApi = object(PublicIntegrationsController, { _postsService: { updateReleaseId: async (...args) => { releaseCalls.push(args); return { id: 'one', releaseId: 'updated' }; } } });
  assert.deepEqual(await publicApi.updateReleaseId({ id: 'org-a' }, 'one', 'updated'), { id: 'one', releaseId: 'updated' });
  assert.deepEqual(releaseCalls, [['org-a', 'one', 'updated']]);
});

test('actual channel menu omits both rename controls and retains working actions', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { Menu } = loadTypeScript('apps/frontend/src/components/launches/menu/menu.tsx', {
    react: { ...React, useState: () => [{ x: 20, y: 110 }, () => {}], useLayoutEffect() {} },
    '@mantine/hooks': { useClickOutside() {} },
    '@gitroom/helpers/utils/custom.fetch': { useFetch: () => () => { throw new Error('Unexpected write'); } },
    '@gitroom/react/toaster/toaster': { useToaster: () => ({}) },
    '@gitroom/frontend/components/layout/new-modal': { useModals: () => ({}) },
    '@gitroom/frontend/components/launches/calendar.context': { useCalendar: () => ({ integrations: [{ ...integration, identifier: 'linkedin', originalName: 'Older name' }] }) },
    '@gitroom/react/helpers/variable.context': { useVariables: () => ({}) },
    '@gitroom/react/translation/get.transation.service.client': { useT: () => (key, fallback) => fallback },
    'next/navigation': { useRouter: () => ({}) },
    'copy-to-clipboard': () => {},
  });
  const html = renderToStaticMarkup(React.createElement(Menu, { id: 'channel-a', canEnable: false, canDisable: true, refreshChannel: () => () => {}, mutate() {}, onChange() {} }));
  assert.doesNotMatch(html, /Rename channel|Reset to original name|custom-name/);
  assert.match(html, /Create a new post/);
  assert.match(html, /Edit Time Slots/);
  if (process.env.COMPAT_MENU_HTML) writeFileSync(process.env.COMPAT_MENU_HTML, html);
});

test('stale comment anchors detach only on edited posts whose visible quote changed', async () => {
  const calls = [];
  const service = object(PostsService, { _postRepository: {
    getAnchoredCommentsForPost: async id => {
      calls.push(['read', id]); return [
        { id: 'stale', anchorStart: 0, anchorEnd: 3, anchorQuote: 'old' },
        { id: 'kept', anchorStart: 0, anchorEnd: 3, anchorQuote: 'new' },
      ];
    },
    detachAnchorsForPost: async (...args) => calls.push(['detach', ...args]),
  } });
  await service.detachStaleAnchors([{ id: 'edited', content: '<p>new text</p>' }]);
  assert.deepEqual(calls, [['read', 'edited'], ['detach', 'edited', ['stale']]]);
});

test('integration repository and public API retain organization and customer filters', async () => {
  const calls = [];
  const repo = object(IntegrationRepository, { _integration: { model: { integration: { findMany: async args => { calls.push(args); return [integration]; } } } } });
  await repo.getIntegrationsList('org-a');
  assert.equal(calls[0].where.organizationId, 'org-a');
  assert.equal(calls[0].where.deletedAt, null);
  const controller = object(PublicIntegrationsController, { _integrationService: {
    getIntegrationsList: async org => {
      assert.equal(org, 'org-a'); return [{ ...integration, customer: { id: 'customer-a', name: 'A' } }, { ...integration, id: 'other', customer: { id: 'customer-b', name: 'B' } }];
    },
  } });
  const result = await controller.listIntegration({ id: 'org-a' }, 'customer-a');
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Provider name');
  assert.equal(result[0].token, undefined);
});
