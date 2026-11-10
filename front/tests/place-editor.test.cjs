const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function setup() {
  const state = [], refs = []; let index = 0, refIndex = 0, resolve;
  let current = { userId: 'a', municipalityId: '3304557', error: 'Falha ao salvar' };
  let writes = 0, done = 0, succeed = true;
  current.createPlace = current.updatePlace = async () => { writes++; return succeed; };
  const jsx = (type, props) => ({ type, props });
  function load(file) {
    const mod = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInThisContext('(function(require,module,exports){' + code + '\n})')((name) => {
      if (name === 'react') return {
        useState: (value) => { const i = index++; if (!(i in state)) state[i] = value; return [state[i], (v) => { state[i] = typeof v === 'function' ? v(state[i]) : v; }]; },
        useRef: (value) => { const i = refIndex++; return refs[i] ||= { current: value }; }, useEffect: () => {},
      };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return { View: 'View' };
      if (name === '@/theme/layout') return require(name);
      if (name === '@/theme') return { spacing: { md: 16 }, useTheme: () => ({ colors: { surface: '#fff' }, isDark: false }) };
      if (name === '@/services/publicData') return { fetchTerritoryLocation: () => new Promise(r => { resolve = r; }) };
      if (name === '@/stores/placesStore') return { usePlacesStore: { getState: () => current } };
      if (name === './useDeviceLocation') return { useDeviceLocation: () => ({ busy: false, error: null }) };
      if (name === './selection') return load('features/places/selection.ts');
      const component = name.split('/').at(-1);
      return { [component]: component };
    }, mod, mod.exports);
    return mod.exports;
  }
  const Editor = load('features/places/PlaceEditor.tsx').PlaceEditor;
  const initialPlace = { id: 'p', name: 'Casa', addressLabel: '', latitude: -22.9, longitude: -43.2, radiusMeters: 1000, neighborhood: null };
  const render = () => { index = 0; refIndex = 0; return Editor({ initialPlace, onDone: () => done++, onCancel: () => {} }); };
  function nodes(tree) { return tree ? [tree, ...[tree.props?.children].flat(Infinity).filter(x => x && typeof x === 'object').flatMap(nodes)] : []; }
  const control = (key, value) => nodes(render()).find(n => n.props?.[key] === value).props;
  return { control, resolve: (value) => resolve(value), count: () => ({ writes, done }), failSave: () => { succeed = false; }, switchScope: () => { current = { ...current, userId: 'b' }; } };
}
const flush = () => new Promise(r => setImmediate(r));
const saveLabel = 'Confirmar ponto e salvar lugar';
test('late point resolution cannot save edited coordinates and leaves the form recoverable', async () => {
  const h = setup(); h.control('title', saveLabel).onPress();
  h.control('label', 'Latitude').onChangeText('-22.95');
  h.resolve({ insideMunicipality: true, neighborhood: null }); await flush();
  assert.equal(h.count().writes, 0);
  assert.equal(h.control('label', 'Latitude').value, '-22.95');
  assert.equal(h.control('title', saveLabel).loading, false);
});
test('storage failure retains the address and does not report success', async () => {
  const h = setup(); h.failSave(); h.control('title', saveLabel).onPress();
  h.resolve({ insideMunicipality: true, neighborhood: null }); await flush();
  assert.deepEqual(h.count(), { writes: 1, done: 0 });
  assert.equal(h.control('label', 'Nome do lugar').value, 'Casa');
  assert.equal(h.control('title', saveLabel).loading, false);
});
test('a response resolved after changing user cannot save into the new scope', async () => {
  const h = setup(); h.control('title', saveLabel).onPress(); h.switchScope();
  h.resolve({ insideMunicipality: true, neighborhood: null }); await flush();
  assert.equal(h.count().writes, 0);
});
