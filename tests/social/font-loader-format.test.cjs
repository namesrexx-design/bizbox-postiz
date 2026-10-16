const assert = require('node:assert/strict');
const { test } = require('node:test');
const { googleFontExtension } = require('../../deploy/lyfe-social/build-tools/font-extension.cjs');

test('font URL query parameters do not hide a normal filename extension', () => {
  assert.equal(googleFontExtension('https://fonts.gstatic.com/a.woff2?v=12', Buffer.from('wOF2')), 'woff2');
});
test('extensionless Google font URLs use the downloaded WOFF signature', () => {
  assert.equal(googleFontExtension('https://fonts.gstatic.com/l/font?kit=fixture', Buffer.from('wOF2fixture')), 'woff2');
  assert.equal(googleFontExtension('https://fonts.gstatic.com/l/font?kit=fixture', Buffer.from('wOFFfixture')), 'woff');
});
test('an extensionless non-font response fails with an actionable error', () => {
  assert.throws(() => googleFontExtension('https://fonts.gstatic.com/l/font?kit=fixture', Buffer.from('<html>error</html>')), /unsupported font payload/);
});
