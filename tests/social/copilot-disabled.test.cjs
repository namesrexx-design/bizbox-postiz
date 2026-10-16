require('reflect-metadata');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Module, createParamDecorator } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { loadTypeScript } = require('./load-typescript.cjs');
class SubscriptionService {
  checkCredits(organization, type) { return { organization: organization.id, type }; }
}
const { CopilotController } = loadTypeScript('apps/backend/src/api/routes/copilot.controller.ts', {
  '@prisma/client': {},
  '@gitroom/nestjs-libraries/user/org.from.request': {
    GetOrgFromRequest: createParamDecorator(() => ({ id: 'test-org' })),
  },
  '@gitroom/nestjs-libraries/database/prisma/subscriptions/subscription.service': { SubscriptionService },
});

test('Copilot HTTP endpoints return 503 promptly with or without a key; credits still work', async t => {
  const originalKey = process.env.OPENAI_API_KEY;
  class TestModule {}
  Module({ controllers: [CopilotController], providers: [SubscriptionService] })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false });
  await app.listen(0, '127.0.0.1');
  t.after(async () => {
    await app.close();
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });
  const base = await app.getUrl();
  for (const key of [undefined, '', 'test-key-must-never-be-used']) {
    if (key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = key;
    for (const [method, route] of [['POST', '/chat'], ['POST', '/agent'], ['GET', '/list'], ['GET', '/test-thread/list']]) {
      const response = await fetch(base + '/copilot' + route, { method, signal: AbortSignal.timeout(2000) });
      assert.equal(response.status, 503, `${method} ${route}`);
      const body = await response.json();
      assert.equal(body.message, 'Copilot is disabled. Open Agent Room.');
    }
  }
  const credits = await fetch(base + '/copilot/credits?type=ai_videos');
  assert.equal(credits.status, 200);
  assert.deepEqual(await credits.json(), { organization: 'test-org', type: 'ai_videos' });
});
