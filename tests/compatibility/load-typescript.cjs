const { readFileSync } = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const boundaries = new Map();

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
    // Only imported service/decorator boundaries are substituted. Tested classes,
    // repository queries, controller mappings and React output come from source.
    if (name.startsWith('@gitroom/') || name.startsWith('@temporalio/') ||
        name === 'nestjs-temporal-core') {
      if (!boundaries.has(name)) boundaries.set(name, new Proxy({}, {
        get(target, key) {
          if (!Object.hasOwn(target, key)) target[key] = function Boundary() { return () => {}; };
          return target[key];
        },
      }));
      return boundaries.get(name);
    }
    if (name === '@sentry/nestjs') return { metrics: { count() {} } };
    if (name === 'sharp' || name === 'axios') return {};
    if (name === '@mastra/core/tools') return { createTool: value => value };
    return require(name);
  };
  new Function('require', 'module', 'exports', result.outputText)(scopedRequire, module, module.exports);
  return module.exports;
}
module.exports = { loadTypeScript, root };
