const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
require('reflect-metadata');
const { Client } = require('pg');
const root = path.resolve(__dirname, '../..');
const library = path.join(root, 'libraries/nestjs-libraries/src');
const dummy = class {};
const originalLoad = Module._load;
// Only auth collaborators are isolated; middleware, controllers, service, repository,
// Prisma client, contracts, HTTP server and all database operations are actual code.
const authDoubles = {
  '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service': { OrganizationService: dummy },
  '@gitroom/nestjs-libraries/database/prisma/oauth/oauth.service': { OAuthService: dummy },
  '@gitroom/nestjs-libraries/sentry/initialize.sentry': { setSentryUserContext() {} },
  '@gitroom/nestjs-libraries/services/exception.filter': { HttpForbiddenException: Error },
};
Module._load = function(request, parent, isMain) {
  if (authDoubles[request]) return authDoubles[request];
  return originalLoad.call(this, request, parent, isMain);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) {
  for (const [prefix, directory] of Object.entries({
    '@gitroom/nestjs-libraries/': library,
    '@gitroom/helpers/': path.join(root, 'libraries/helpers/src'),
    '@gitroom/backend/': path.join(root, 'apps/backend/src'),
  })) if (request.startsWith(prefix)) request = path.join(directory, request.slice(prefix.length));
  if (request.startsWith('/') || request.startsWith('.')) {
    const resolved = request.startsWith('/') ? request : path.resolve(path.dirname(parent.filename), request);
    if (fs.existsSync(resolved + '.ts')) request = resolved + '.ts';
  }
  return originalResolve.call(this, request, parent, ...rest);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, experimentalDecorators: true, emitDecoratorMetadata: true, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
const { PrismaService } = require(path.join(library, 'database/prisma/prisma.service.ts'));
const { FacebookProfileService } = require(path.join(library, 'facebook-profile/facebook.profile.service.ts'));
const { digest, PROFILE_INTERNAL_ID, PROFILE_TOKEN, applyNativeResult, validateBatch } = require(path.join(library, 'facebook-profile/contract.ts'));
const { PostsRepository } = require(path.join(library, 'database/prisma/posts/posts.repository.ts'));
const { PublicFacebookProfileController } = require(path.join(root, 'apps/backend/src/public-api/routes/v1/public.facebook.profile.controller.ts'));
const { PublicAuthMiddleware } = require(path.join(root, 'apps/backend/src/services/auth/public.auth.middleware.ts'));
const { Test } = require('@nestjs/testing');

let db, sql, profiles, repository, app, base, laneA, laneB, page;
const orgA = 'fixture-org-a', orgB = 'fixture-org-b';
const batch = (suffix = '') => ({ schema: 'bizbox.facebook-profile-batch.v1', batchId: 'batch' + suffix,
  profileUrl: 'https://www.facebook.com/fixture.profile', profileName: 'Fixture', timezone: 'America/Los_Angeles', items: [{
    id: 'reel' + suffix, caption: 'Exact approved caption ' + suffix, mediaUrl: 'https://media.example.test/reel.mp4', mediaSha256: 'a'.repeat(64), mediaBytes: 200,
    scheduleAt: '2026-11-01T18:00:00Z', audience: 'Public', aiLabel: true,
  }] });
function draft(b = batch(), lane = laneA) {
  const item = b.items[0];
  return { type: 'draft', shortLink: false, tags: [], date: item.scheduleAt, posts: [{ integration: { id: lane }, value: [{ content: item.caption, image: [{ id: item.mediaSha256, path: item.mediaUrl }] }], settings: { __type: 'facebook', bizboxFacebookProfile: { version: 1, lane: 'facebook-profile', approvalId: 'appr_' + b.batchId, digest: digest(b), batch: b, itemId: item.id } } }] };
}
const proof = b => ({ approvalId: 'appr_' + b.batchId, digest: digest(b), native: { status: 'scheduled', url: 'https://www.facebook.com/reel/12345/', scheduleAt: b.items[0].scheduleAt, audience: 'Public', aiLabel: true } });
const stage = async (b, lane = laneA, org = orgA) => (await profiles.interceptDraft(org, draft(b, lane), 'API'))[0].postId;
const rejectsStatus = (promise, status) => assert.rejects(promise, err => err.getStatus?.() === status);
const request = async (route, { method = 'GET', token = 'org-a-key', body, headers = {} } = {}) => {
  const response = await fetch(base + '/public/v1/facebook-profile' + route, { method, headers: { ...(token ? { authorization: token } : {}), 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
};
async function read(id) { return db.post.findUniqueOrThrow({ where: { id } }); }
async function guardReject(query) { await assert.rejects(sql.query(query), err => ['23514', '23505'].includes(err.code)); }

before(async () => {
  const url = new URL(process.env.DATABASE_URL);
  assert.equal(process.env.PROFILE_FIXTURE_DATABASE, 'profile_test');
  assert.equal(url.hostname, 'profile-test-pg'); assert.equal(url.pathname, '/profile_test');
  delete process.env.STRIPE_SECRET_KEY;
  db = new PrismaService(); await db.$connect();
  sql = new Client({ connectionString: process.env.DATABASE_URL }); await sql.connect();
  profiles = new FacebookProfileService(db);
  const wrapper = { model: db };
  repository = new PostsRepository(wrapper, wrapper, wrapper, wrapper, wrapper, wrapper);
  await db.organization.createMany({ data: [{ id: orgA, name: 'Fixture A' }, { id: orgB, name: 'Fixture B' }] });
  const testing = await Test.createTestingModule({ controllers: [PublicFacebookProfileController], providers: [{ provide: FacebookProfileService, useValue: profiles }] }).compile();
  app = testing.createNestApplication({ logger: false });
  const auth = new PublicAuthMiddleware({
    getOrgByApiKey: async key => key === 'org-a-key' ? { id: orgA } : key === 'org-b-key' ? { id: orgB } : undefined,
    canUseSuperAdminApi: async () => false,
  }, { getOrgByOAuthToken: async () => undefined });
  app.use((req, res, next) => auth.use(req, res, next));
  await app.listen(0, '127.0.0.1'); base = await app.getUrl();
});
after(async () => { await app?.close(); await sql?.end(); await db?.$disconnect(); });

test('default disabled capabilities/provisioning/result are denied', async () => {
  delete process.env.FACEBOOK_PROFILE_ORGANIZATIONS;
  for (const [route, method, body] of [['/capabilities', 'GET'], ['/lane', 'POST'], ['/posts/no/result', 'PUT', {}]]) {
    assert.equal((await request(route, { method, body })).status, 404);
  }
});
test('allowlisted org still fails closed before real database protection', async () => {
  process.env.FACEBOOK_PROFILE_ORGANIZATIONS = `${orgA},${orgB}`;
  assert.equal((await request('/capabilities')).status, 503);
  assert.equal((await request('/lane', { method: 'POST' })).status, 503);
  await sql.query(fs.readFileSync(path.join(root, 'deploy/facebook-profile/install-guard.sql'), 'utf8'));
  assert.equal((await request('/capabilities')).status, 404);
});
test('actual HTTP authentication rejects missing/invalid/OAuth/wrong-org override', async () => {
  assert.equal((await request('/lane', { method: 'POST', token: null })).status, 401);
  assert.equal((await request('/lane', { method: 'POST', token: 'wrong' })).status, 401);
  assert.equal((await request('/lane', { method: 'POST', token: 'pos_invalid' })).status, 401);
  assert.equal((await request('/lane', { method: 'POST', headers: { 'x-postiz-org': orgB } })).status, 403);
});
test('provisioning is idempotent, isolated per org and uses no provider token', async () => {
  const a = await request('/lane', { method: 'POST' }); assert.equal(a.status, 201);
  const again = await request('/lane', { method: 'POST' }); assert.deepEqual(again, a);
  laneA = a.body.integrationId;
  laneB = (await request('/lane', { method: 'POST', token: 'org-b-key' })).body.integrationId;
  assert.notEqual(laneA, laneB);
  const integration = await db.integration.findUniqueOrThrow({ where: { id: laneA } });
  assert.equal(integration.internalId, PROFILE_INTERNAL_ID); assert.equal(integration.token, PROFILE_TOKEN);
  assert.equal(integration.providerIdentifier, 'facebook'); assert.equal(integration.tokenExpiration, null);
  page = (await db.integration.create({ data: { internalId: 'ordinary-page', organizationId: orgA, providerIdentifier: 'facebook', name: 'Ordinary Page fixture', token: 'fixture-only', type: 'social' } })).id;
});
test('capabilities advertises exactly the installed PR507 contract', async () => {
  assert.deepEqual(await request('/capabilities'), { status: 200, body: { version: 1, nativeScheduledWriteback: true, draftOnly: true, exactMediaReadback: true } });
});
test('disabled/missing database trigger blocks capabilities', async () => {
  await sql.query('ALTER TABLE "Post" DISABLE TRIGGER bizbox_profile_post_v1');
  try { assert.equal((await request('/capabilities')).status, 503); }
  finally { await sql.query('ALTER TABLE "Post" ENABLE ALWAYS TRIGGER bizbox_profile_post_v1'); }
});
test('exact single draft saves real media and appears in actual org-scoped repository readback', async () => {
  const b = batch('readback'); const id = await stage(b);
  const posts = await repository.getPosts(orgA, { startDate: '2026-10-01T00:00:00Z', endDate: '2026-12-01T00:00:00Z' });
  const post = posts.find(p => p.id === id);
  assert.equal(post.state, 'DRAFT'); assert.equal(post.content, b.items[0].caption);
  assert.deepEqual(JSON.parse(post.image), draft(b).posts[0].value[0].image);
  assert.equal(post.integration.id, laneA); assert.equal(post.releaseId, null);
  assert.equal((await repository.getPosts(orgB, { startDate: '2026-10-01T00:00:00Z', endDate: '2026-12-01T00:00:00Z' })).some(p => p.id === id), false);
});
test('staging exact retries and concurrent retries produce one canonical draft', async () => {
  const b = batch('concurrent'); const ids = await Promise.all(Array.from({ length: 4 }, () => stage(b)));
  assert.equal(new Set(ids).size, 1); assert.equal(await stage(b), ids[0]);
  const all = await db.post.findMany({ where: { integrationId: laneA } });
  assert.equal(all.filter(p => JSON.parse(p.settings).bizboxFacebookProfile.approvalId === 'appr_' + b.batchId).length, 1);
});
test('schedule/now/update/recurrence/shortlink/tags/comments/edit/native injection/mixed batch fail before writes', async () => {
  const count = await db.post.count();
  const changes = [x => x.type = 'schedule', x => x.type = 'now', x => x.type = 'update', x => x.inter = 1,
    x => x.shortLink = true, x => x.tags = [{ value: 'x', label: 'x' }], x => x.posts[0].value.push(x.posts[0].value[0]),
    x => x.posts[0].value[0].id = 'some-existing-id', x => x.posts[0].group = 'group', x => x.posts[0].value[0].delay = 100,
    x => x.posts[0].settings.bizboxFacebookProfile.native = proof(batch()).native, x => x.posts.push(x.posts[0])];
  for (const change of changes) { const body = draft(batch()); change(body); await rejectsStatus(profiles.interceptDraft(orgA, body, 'API'), 409); }
  assert.equal(await db.post.count(), count);
});
test('media/caption/date/digest/item/organization/lane drift and missing metadata are rejected', async () => {
  const count = await db.post.count();
  const changes = [x => x.posts[0].value[0].content += 'drift', x => x.posts[0].value[0].image[0].path += '?changed',
    x => x.posts[0].value[0].image[0].id = 'b'.repeat(64), x => x.date = '2026-11-02T18:00:00Z',
    x => x.posts[0].settings.bizboxFacebookProfile.digest = '0'.repeat(64), x => x.posts[0].settings.bizboxFacebookProfile.itemId = 'wrong',
    x => x.posts[0].integration.id = laneB, x => x.posts[0].integration.id = page, x => delete x.posts[0].settings.bizboxFacebookProfile];
  for (const change of changes) { const body = draft(batch()); change(body); await rejectsStatus(profiles.interceptDraft(orgA, body, 'API'), 409); }
  assert.equal(await db.post.count(), count);
});
test('invalid batch shapes, media, repeated items/times and ambiguous DST rejected', () => {
  const changes = [b => b.extra = true, b => b.items[0].mediaBytes = 0, b => b.items[0].mediaSha256 = 'bad',
    b => b.items[0].mediaUrl = 'http://media.example.test/reel.mp4', b => b.items[0].audience = 'Private', b => b.items[0].aiLabel = false,
    b => b.items[0].scheduleAt = '2026-02-30T18:00:00Z', b => b.items.push({ ...b.items[0] }), b => b.items[0].scheduleAt = '2026-11-01T08:30:00Z'];
  for (const change of changes) { const b = batch(); change(b); assert.throws(() => validateBatch(b)); }
});
test('cross-org/missing/ordinary Page result IDs return 404 without mutation', async () => {
  const id = await stage(batch('scoped')); const before = await read(id);
  assert.equal((await request(`/posts/${id}/result`, { method: 'PUT', token: 'org-b-key', body: proof(batch('scoped')) })).status, 404);
  assert.equal((await request('/posts/missing/result', { method: 'PUT', body: proof(batch()) })).status, 404);
  const normal = await db.post.create({ data: { organizationId: orgA, integrationId: page, publishDate: new Date(batch().items[0].scheduleAt), state: 'DRAFT', content: 'ordinary', group: 'ordinary' } });
  assert.equal((await request(`/posts/${normal.id}/result`, { method: 'PUT', body: proof(batch()) })).status, 404);
  assert.deepEqual(await read(id), before);
});
test('actual HTTP result saves scheduled link/status atomically; GET repository reads committed image and native proof', async () => {
  const b = batch('result'); const id = await stage(b); const initial = await read(id);
  const response = await request(`/posts/${id}/result`, { method: 'PUT', body: proof(b) }); assert.equal(response.status, 200);
  assert.equal(response.body.state, 'DRAFT'); assert.equal(response.body.releaseId, null);
  const saved = await read(id); assert.equal(saved.releaseURL, proof(b).native.url);
  assert.deepEqual(JSON.parse(saved.settings).bizboxFacebookProfile.native, proof(b).native);
  assert.equal(saved.image, initial.image); assert.deepEqual(saved.publishDate, initial.publishDate);
  const post = (await repository.getPosts(orgA, { startDate: '2026-10-01', endDate: '2026-12-01' })).find(p => p.id === id);
  assert.equal(post.releaseURL, saved.releaseURL); assert.equal(post.image, initial.image); assert.equal(post.state, 'DRAFT');
  const again = await request(`/posts/${id}/result`, { method: 'PUT', body: proof(b) }); assert.equal(again.status, 200);
  const bad = proof(b); bad.native.url = 'https://www.facebook.com/reel/99999/';
  assert.equal((await request(`/posts/${id}/result`, { method: 'PUT', body: bad })).status, 409);
  assert.equal((await read(id)).settings, saved.settings);
});
test('concurrent conflicting native results serialize; exactly one wins, identical retries pass', async () => {
  const b = batch('raceresult'); const id = await stage(b);
  const first = proof(b), second = proof(b); second.native.url = 'https://www.facebook.com/reel/98765/';
  const results = await Promise.all([request(`/posts/${id}/result`, { method: 'PUT', body: first }), request(`/posts/${id}/result`, { method: 'PUT', body: second })]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  const saved = await read(id); const native = JSON.parse(saved.settings).bizboxFacebookProfile.native;
  assert.equal(saved.releaseURL, native.url); assert.ok([first.native.url, second.native.url].includes(native.url));
  assert.equal((await request(`/posts/${id}/result`, { method: 'PUT', body: { ...first, native } })).status, 200);
});
test('invalid native status/link/time/audience/label/extra field/approval/digest leave database unchanged', async () => {
  const b = batch('negative'); const id = await stage(b); const initial = await read(id);
  const changes = [x => x.native.status = 'published', x => x.native.url = 'https://evil.example/reel/1', x => x.native.scheduleAt = '2026-11-02T18:00:00Z',
    x => x.native.audience = 'Private', x => x.native.aiLabel = false, x => x.native.extra = true, x => x.approvalId = 'appr_other', x => x.digest = '0'.repeat(64), x => x.native = null];
  for (const change of changes) { const body = proof(b); change(body); assert.equal((await request(`/posts/${id}/result`, { method: 'PUT', body })).status, 409); }
  assert.deepEqual(await read(id), initial);
});
test('database guard rejects every native state/releaseId promotion even through direct SQL', async () => {
  const id = await stage(batch('guard')); const before = await read(id);
  for (const state of ['QUEUE', 'PUBLISHED', 'ERROR']) await guardReject(`UPDATE "Post" SET state='${state}' WHERE id='${id}'`);
  await guardReject(`UPDATE "Post" SET "releaseId"='native-id' WHERE id='${id}'`);
  assert.deepEqual(await read(id), before);
});
test('database guard freezes approved date/media/content/settings/lane/deletion', async () => {
  const id = await stage(batch('freeze')); const before = await read(id);
  const updates = ['"publishDate"=now()', 'image=\'[]\'', 'content=\'changed\'', 'settings=\'{}\'', `"integrationId"='${page}'`, '"deletedAt"=now()', '"intervalInDays"=2'];
  for (const update of updates) await guardReject(`UPDATE "Post" SET ${update} WHERE id='${id}'`);
  await guardReject(`DELETE FROM "Post" WHERE id='${id}'`);
  assert.deepEqual(await read(id), before);
});
test('direct unvalidated reserved insertion and metadata on an ordinary Page are blocked', async () => {
  const b = batch('bypass'); const body = draft(b); const p = body.posts[0];
  await assert.rejects(db.post.create({ data: { organizationId: orgA, integrationId: laneA, state: 'DRAFT', publishDate: new Date(body.date), content: p.value[0].content, image: JSON.stringify(p.value[0].image), settings: JSON.stringify(p.settings), group: 'bypass' } }));
  await assert.rejects(db.post.create({ data: { organizationId: orgA, integrationId: page, state: 'DRAFT', publishDate: new Date(body.date), content: p.value[0].content, settings: JSON.stringify(p.settings), group: 'bypass-page' } }));
});
test('guard prevents profile integration gaining Page credentials/reclassification or converting an existing Page', async () => {
  await guardReject(`UPDATE "Integration" SET token='page-secret' WHERE id='${laneA}'`);
  await guardReject(`UPDATE "Integration" SET "internalId"='ordinary' WHERE id='${laneA}'`);
  await guardReject(`UPDATE "Integration" SET "providerIdentifier"='linkedin' WHERE id='${laneA}'`);
  await guardReject(`DELETE FROM "Integration" WHERE id='${laneA}'`);
  await guardReject(`UPDATE "Integration" SET "internalId"='${PROFILE_INTERNAL_ID}',token='${PROFILE_TOKEN}' WHERE id='${page}'`);
});
test('ordinary Page drafts/QUEUE/publishDate and source fields retain normal behavior', async () => {
  const data = { organizationId: orgA, integrationId: page, state: 'QUEUE', publishDate: new Date('2026-12-01T18:00:00Z'), content: 'ordinary page', image: '[]', settings: '{}', group: 'normal-page' };
  const row = await db.post.create({ data });
  const saved = await db.post.update({ where: { id: row.id }, data: { publishDate: new Date('2026-12-02T18:00:00Z'), state: 'PUBLISHED', releaseId: 'ordinary-native-id', releaseURL: 'https://www.facebook.com/page/posts/1' } });
  assert.equal(saved.state, 'PUBLISHED'); assert.equal(saved.releaseId, 'ordinary-native-id');
  assert.equal(await profiles.interceptDraft(orgA, { type: 'draft', posts: [{ integration: { id: page }, settings: {} }] }, 'API'), null);
});
test('organization removal revokes extension access while keeping frozen history intact', async () => {
  const b = batch('revoke'); const id = await stage(b); const initial = await read(id);
  process.env.FACEBOOK_PROFILE_ORGANIZATIONS = orgB;
  try {
    assert.equal((await request('/capabilities')).status, 404);
    assert.equal((await request(`/posts/${id}/result`, { method: 'PUT', body: proof(b) })).status, 404);
    await rejectsStatus(profiles.interceptDraft(orgA, draft(batch('revoked-new')), 'API'), 404);
  } finally { process.env.FACEBOOK_PROFILE_ORGANIZATIONS = `${orgA},${orgB}`; }
  assert.deepEqual(await read(id), initial);
});
test('canonical module/service wiring includes auth, staging intercept, workflow/status/date/settings guards and media projection', () => {
  const publicModule = fs.readFileSync(path.join(root, 'apps/backend/src/public-api/public.api.module.ts'), 'utf8');
  assert.match(publicModule, /authenticatedController = \[PublicIntegrationsController, PublicFacebookProfileController\]/);
  assert.match(publicModule, /PublicAuthMiddleware\).forRoutes\(\.\.\.authenticatedController\)/);
  const service = fs.readFileSync(path.join(library, 'database/prisma/posts/posts.service.ts'), 'utf8');
  assert.match(service, /await this\._facebookProfiles\.interceptDraft\(orgId, body, creationMethod\)/);
  assert.match(service, /state === 'DRAFT' \|\| isProfileIntegration\(workflowPost\?\.integration\)/);
  assert.match(service, /isProfileIntegration\(getPostById.integration\)/);
  assert.match(service, /isProfileIntegration\(getPostById\?\.integration\)/);
  assert.match(service, /isProfileIntegration\(integration\)/);
});
