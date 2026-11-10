// Permite que os testes com loader próprio carreguem módulos puros via alias "@/" (TypeScript).
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith('@/')) {
    const base = path.join(root, request.slice(2));
    for (const ext of ['.ts', '.tsx', '/index.ts']) {
      if (fs.existsSync(base + ext)) return base + ext;
    }
  }
  return originalResolve.call(this, request, ...rest);
};
require.extensions['.ts'] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  module._compile(code, filename);
};
