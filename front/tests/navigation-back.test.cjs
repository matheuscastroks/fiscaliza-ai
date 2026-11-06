const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function run(hasHistory) {
  let backed = false, destination;
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('utils/navigation.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})')((name) => name === 'expo-router'
    ? { router: { canGoBack: () => hasHistory, back: () => { backed = true; }, replace: value => { destination = value; } } }
    : { useAuthStore: { getState: () => ({ isAuthenticated: false, user: null }) } }, mod, mod.exports);
  mod.exports.goBack(); return { backed, destination };
}
test('a public direct link returns to discovery without requiring login', () => {
  assert.deepEqual(run(false), { backed: false, destination: '/(tabs)' });
});
test('existing navigation history is preserved when going back', () => {
  assert.deepEqual(run(true), { backed: true, destination: undefined });
});
