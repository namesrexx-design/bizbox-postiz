const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');
const prefix = '@gitroom/nestjs-libraries/';
const unused = () => { throw new Error('Unexpected media/workflow dependency'); };
const common = {
  '@prisma/client': {},
  sharp: unused,
  '@gitroom/helpers/utils/timer': { timer: unused },
};
const base = loadTypeScript('libraries/nestjs-libraries/src/integrations/social.abstract.ts', {
  ...common,
  '@temporalio/activity': { ApplicationFailure: class extends Error {} },
  [prefix + 'temporal/temporal.heartbeat']: { setHeartbeatDetails: unused },
  [prefix + 'dtos/webhooks/ssrf.safe.dispatcher']: {},
});
const { LinkedinProvider } = loadTypeScript('libraries/nestjs-libraries/src/integrations/social/linkedin.provider.ts', {
  ...common,
  'mime-types': { lookup: unused },
  'image-to-pdf': unused,
  [prefix + 'services/make.is']: { makeId: unused },
  [prefix + 'services/make.secure.id']: { makeSecureId: length => 's'.repeat(length) },
  '@gitroom/helpers/utils/has.extension': { hasExtension: unused },
  [prefix + 'integrations/social.abstract']: base,
  '@gitroom/helpers/decorators/post.plug': { PostPlug: () => () => {} },
  [prefix + 'dtos/posts/providers-settings/linkedin.dto']: { LinkedinDto: class {} },
  [prefix + 'chat/rules.description.decorator']: { Rules: () => () => {} },
});
const scopes = ['openid', 'profile', 'w_member_social'];
const member = { sub: 'member-123', name: 'Test Member', picture: 'https://example.test/photo.png' };

function mockLinkedin(t, granted, profile = member) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    if (url === 'https://www.linkedin.com/oauth/v2/accessToken') {
      return { json: async () => ({ access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600, scope: granted }) };
    }
    if (url === 'https://api.linkedin.com/v2/userinfo') {
      assert.equal(options.headers.Authorization, 'Bearer test-access');
      return { json: async () => profile };
    }
    throw new Error(`Forbidden extra LinkedIn request: ${url}`);
  });
  return calls;
}

test('personal authorization URL requests exactly OIDC and member publishing scopes', async () => {
  const provider = new LinkedinProvider();
  assert.deepEqual(provider.scopes, scopes);
  const auth = await provider.generateAuthUrl();
  const url = new URL(auth.url);
  assert.equal(url.searchParams.get('scope'), scopes.join(' '));
  assert.equal(url.searchParams.get('state'), auth.state);
  assert.match(url.searchParams.get('redirect_uri'), /\/integrations\/social\/linkedin$/);
});

for (const granted of [scopes.join(' '), scopes.join(','), encodeURIComponent(scopes.join(' ')), scopes]) {
  test(`authenticate accepts granted personal scopes: ${JSON.stringify(granted)}`, async t => {
    const calls = mockLinkedin(t, granted);
    const result = await new LinkedinProvider().authenticate({ code: 'test-code', codeVerifier: '' });
    assert.deepEqual(result, { id: member.sub, name: member.name, picture: member.picture, username: '', accessToken: 'test-access', refreshToken: 'test-refresh', expiresIn: 3600 });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].options.body.get('grant_type'), 'authorization_code');
  });
}

for (const missing of scopes) {
  test(`authenticate rejects missing ${missing} before reading member data`, async t => {
    const calls = mockLinkedin(t, scopes.filter(scope => scope !== missing).join(' '));
    await assert.rejects(new LinkedinProvider().authenticate({ code: 'test-code', codeVerifier: '' }), error => error instanceof base.NotEnoughScopes);
    assert.equal(calls.length, 1);
  });
}

test('refresh maps OIDC subject and profile without requesting /v2/me', async t => {
  const calls = mockLinkedin(t, scopes.join(' '));
  const result = await new LinkedinProvider().refreshToken('old-refresh');
  assert.deepEqual(result, { id: member.sub, name: member.name, picture: member.picture, username: '', accessToken: 'test-access', refreshToken: 'test-refresh', expiresIn: 3600 });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.body.get('grant_type'), 'refresh_token');
  assert.equal(calls[0].options.body.get('refresh_token'), 'old-refresh');
});

for (const operation of ['authenticate', 'refreshToken']) {
  test(`${operation} accepts a member without a picture or vanity name`, async t => {
    mockLinkedin(t, scopes.join(' '), { sub: member.sub, name: member.name });
    const provider = new LinkedinProvider();
    const result = operation === 'authenticate'
      ? await provider.authenticate({ code: 'test-code', codeVerifier: '' })
      : await provider.refreshToken('old-refresh');
    assert.equal(result.id, member.sub);
    assert.equal(result.picture, '');
    assert.equal(result.username, '');
  });
}
