require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { Module } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const cookieParser = require('cookie-parser');
const { sign } = require('jsonwebtoken');
const { loadTypeScript, root } = require('./load-typescript.cjs');
const { AuthService } = loadTypeScript('libraries/helpers/src/auth/auth.service.ts');
const { SourceController } = loadTypeScript('apps/backend/src/api/routes/source.controller.ts', {
  '@gitroom/helpers/auth/auth.service': { AuthService },
});

test('signed-in source download: exact bytes, session validation, fixed path and unavailable states', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'social-source-test-'));
  const revision = 'a'.repeat(40);
  const bytes = process.env.SOURCE_DOWNLOAD_TEST_ARCHIVE
    ? require('node:fs').readFileSync(process.env.SOURCE_DOWNLOAD_TEST_ARCHIVE)
    : require('node:zlib').gzipSync(Buffer.from('synthetic source fixture'));
  const prior = { ...process.env };
  Object.assign(process.env, {
    JWT_SECRET: 'synthetic-source-test-secret',
    RELEASE_SOURCE_REVISION: revision,
    RELEASE_SOURCE_ARCHIVE: path.join(directory, 'source.tar.gz'),
  });
  await writeFile(process.env.RELEASE_SOURCE_ARCHIVE, bytes);
  let user = { id: 'test-user', activated: true, isSuperAdmin: false };
  let reads = 0;
  const users = { async getUserById(id) { reads++; return id === 'test-user' ? user : null; } };
  class SourceTestModule {}
  Module({ controllers: [SourceController], providers: Reflect.getMetadata('design:paramtypes', SourceController)
    .map(provide => ({ provide, useValue: users })) })(SourceTestModule);
  const app = await NestFactory.create(SourceTestModule, { logger: false, abortOnError: false });
  app.use(cookieParser());
  await app.listen(0, '127.0.0.1');
  t.after(async () => { await app.close(); await rm(directory, { recursive: true });
    for (const key of ['JWT_SECRET', 'RELEASE_SOURCE_REVISION', 'RELEASE_SOURCE_ARCHIVE']) {
      if (prior[key] === undefined) delete process.env[key]; else process.env[key] = prior[key];
    }
  });
  const base = await app.getUrl();
  const url = `${base}/source/${revision}.tar.gz`;
  const token = sign({ id: 'test-user' }, process.env.JWT_SECRET);
  const headers = { cookie: `auth=${token}` };
  assert.equal((await fetch(url)).status, 401);
  assert.equal((await fetch(url, { headers: { auth: 'forged' } })).status, 401);
  assert.equal((await fetch(url, { headers: { auth: sign({ id: 'test-user' }, 'wrong-key') } })).status, 401);
  assert.equal((await fetch(url, { headers: { auth: sign({ id: 'test-user', exp: 1 }, process.env.JWT_SECRET) } })).status, 401);
  assert.equal(reads, 0);
  assert.equal((await fetch(url, { headers: { auth: sign({ id: 'removed-user', activated: true }, process.env.JWT_SECRET) } })).status, 401);
  user.activated = false;
  assert.equal((await fetch(url, { headers })).status, 401);
  user.activated = true;
  const response = await fetch(url, { headers });
  assert.equal(response.status, 200);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
  assert.equal(response.headers.get('content-type'), 'application/gzip');
  assert.equal(response.headers.get('content-length'), String(bytes.length));
  assert.match(response.headers.get('content-disposition'), new RegExp(`attachment; filename="lyfe-social-${revision}.tar.gz"`));
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await fetch(url, { headers: { auth: token } })).status, 200);
  for (const name of ['b'.repeat(40) + '.tar.gz', 'etc%2Fpasswd', '..%2Fsource.tar.gz']) {
    assert.equal((await fetch(`${base}/source/${name}`, { headers })).status, 404);
  }
  process.env.RELEASE_SOURCE_REVISION = '';
  assert.equal((await fetch(url, { headers })).status, 503);
  process.env.RELEASE_SOURCE_REVISION = revision;
  await rm(process.env.RELEASE_SOURCE_ARCHIVE);
  assert.equal((await fetch(url, { headers })).status, 503);
  const apiModule = require('node:fs').readFileSync(path.join(root, 'apps/backend/src/api/api.module.ts'), 'utf8');
  assert.match(apiModule, /RootController,\s+PaymentController,\s+SourceController,/);
});
