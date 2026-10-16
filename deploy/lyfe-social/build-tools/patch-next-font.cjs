// Apply only inside the disposable build container. The immutable image and
// dependency lock stay intact; the patch and helper form part of the source offer.
const fs = require('node:fs');
const nextVersion = require('/app/node_modules/next/package.json').version;
if (nextVersion !== '16.3.1') throw new Error(`Review the font-loader patch for Next ${nextVersion}`);
const file = '/app/node_modules/next/dist/compiled/@next/font/dist/google/loader.js';
const oldExpression = String.raw`/\.(woff|woff2|eot|ttf|otf)$/.exec(googleFontFileUrl)[1]`;
const replacement = `require(${JSON.stringify(require.resolve('./font-extension.cjs'))}).googleFontExtension(googleFontFileUrl, fontFileBuffer)`;
const source = fs.readFileSync(file, 'utf8');
if (!source.includes(oldExpression)) throw new Error('Next font-loader expression changed; inspect before patching.');
fs.writeFileSync(file, source.replace(oldExpression, replacement));
