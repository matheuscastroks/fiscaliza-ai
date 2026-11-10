const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('neighborhood picker merges boundary names with the names published by the 1746, without duplicates', () => {
  let boundaries = [];
  let official = [];
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync('features/city/NeighborhoodPicker.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})')((name) => {
    if (name === 'react') return { useMemo: fn => fn() };
    if (name === 'react/jsx-runtime') return { jsx: (_type, props) => props };
    if (name === '@/features/territory/usePublicData') return { useNeighborhoods: () => ({ data: boundaries }) };
    if (name === '@/features/city/useOfficialCalls') return { useOfficialFilters: () => ({ data: { bairros: official } }) };
    if (name === '@/stores/territoryStore') return { useTerritoryStore: select => select({ preferredNeighborhood: 'Centro' }) };
    if (name === '@/components/ui/AppSelect') return { AppSelect: 'select' };
    if (name === '@/shared/neighborhood') return { normalizeNeighborhood: text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() };
    throw new Error(name);
  }, mod, mod.exports);
  const props = { options: ['Tijuca', 'Centro'], value: 'Centro', onChange: () => {} };
  const fallback = mod.exports.NeighborhoodPicker(props);
  assert.deepEqual(Array.from(fallback.options, item => item.value), ['', 'Centro', 'Tijuca']);
  assert.equal(fallback.value, 'Centro');
  // Catálogo geográfico incompleto: nomes do 1746 completam a lista (sem repetir "Centro").
  boundaries = [{ id: 'canonical', name: 'São Cristóvão' }];
  official = ['Centro', 'Abolição', 'sao cristovao'];
  const merged = mod.exports.NeighborhoodPicker({ ...props, value: 'sao cristovao' });
  assert.deepEqual(Array.from(merged.options, item => item.value), ['', 'Centro', 'Abolição', 'São Cristóvão', 'Tijuca']);
  assert.equal(merged.value, 'São Cristóvão');
});
