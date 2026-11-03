const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('neighborhood picker uses published labels when the geographic catalog is empty', () => {
  let boundaries = [];
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('features/city/NeighborhoodPicker.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})')((name) => {
    if (name === 'react') return { useMemo: fn => fn() };
    if (name === 'react/jsx-runtime') return { jsx: (_type, props) => props };
    if (name === '@/features/territory/usePublicData') return { useNeighborhoods: () => ({ data: boundaries }) };
    if (name === '@/stores/territoryStore') return { useTerritoryStore: select => select({ preferredNeighborhood: 'Centro' }) };
    if (name === '@/components/ui/AppSelect') return { AppSelect: 'select' };
    if (name === '@/shared/civic-territory') return { normalizeNeighborhood: text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() };
    throw new Error(name);
  }, mod, mod.exports);
  const props = { options: ['Tijuca', 'Centro'], value: 'Centro', onChange: () => {} };
  const fallback = mod.exports.NeighborhoodPicker(props);
  assert.deepEqual(Array.from(fallback.options, item => item.value), ['', 'Centro', 'Tijuca']);
  assert.equal(fallback.value, 'Centro');
  boundaries = [{ id: 'canonical', name: 'São Cristóvão' }];
  const canonical = mod.exports.NeighborhoodPicker({ ...props, value: 'sao cristovao' });
  assert.deepEqual(Array.from(canonical.options, item => item.value), ['', 'São Cristóvão']);
  assert.equal(canonical.value, 'São Cristóvão');
});
