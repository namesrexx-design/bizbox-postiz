const { readFileSync } = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');

// Exercise the production classes without booting databases, Temporal or media
// codecs. Tests explicitly provide only dependencies outside the exercised flow.
function loadTypeScript(file, dependencies = {}) {
  const absolute = path.join(root, file);
  const result = ts.transpileModule(readFileSync(absolute, 'utf8'), {
    fileName: absolute,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      esModuleInterop: true,
    },
  });
  const errors = result.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
  if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCurrentDirectory: () => root, getCanonicalFileName: f => f, getNewLine: () => '\n',
  }));
  const module = { exports: {} };
  const scopedRequire = name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    if (name.startsWith('@gitroom/')) throw new Error(`Unconfigured application dependency: ${name}`);
    return require(name);
  };
  new Function('require', 'module', 'exports', result.outputText)(scopedRequire, module, module.exports);
  return module.exports;
}
module.exports = { loadTypeScript, root };
