const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
test('radial transport preserves every geographic parameter including zero and forwards cancellation', async () => {
  const calls = []; const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('services/officialCalls.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})')(() => ({ request: async (...args) => { calls.push(args); return {}; } }), mod, mod.exports);
  const controller = new AbortController();
  await mod.exports.fetchOfficialCalls({ centerLatitude: 0, centerLongitude: -43.2, radiusMeters: 500, limit: 5 }, controller.signal);
  const url = new URL(calls[0][0], 'http://local');
  assert.equal(url.searchParams.get('centerLatitude'), '0');
  assert.equal(url.searchParams.get('centerLongitude'), '-43.2');
  assert.equal(url.searchParams.get('radiusMeters'), '500');
  assert.equal(calls[0][3], controller.signal);
});
