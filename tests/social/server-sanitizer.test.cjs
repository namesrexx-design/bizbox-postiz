const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTypeScript } = require('./load-typescript.cjs');

test('native server sanitizer loads jsdom assets and removes unsafe post HTML', () => {
  const { sanitizePostContent } = loadTypeScript('libraries/helpers/src/utils/sanitize.post.content.ts');
  const html = sanitizePostContent('<p>Hello <strong>world</strong></p><script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">unsafe</a>');
  assert.match(html, /<p>Hello <strong>world<\/strong><\/p>/);
  assert.doesNotMatch(html, /script|onerror|javascript:|<img/i);
});
