// Google Fonts can return a query URL whose pathname has no font extension.
// Keep normal URLs unchanged; detect the actual downloaded WOFF format otherwise.
function googleFontExtension(sourceUrl, bytes) {
  const pathname = new URL(sourceUrl).pathname;
  const match = /\.(woff|woff2|eot|ttf|otf)$/i.exec(pathname);
  if (match) return match[1].toLowerCase();
  const signature = Buffer.from(bytes).subarray(0, 4).toString('ascii');
  if (signature === 'wOF2') return 'woff2';
  if (signature === 'wOFF') return 'woff';
  throw new Error(`Google Fonts returned an unsupported font payload at ${sourceUrl}`);
}
module.exports = { googleFontExtension };
