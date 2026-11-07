const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function setup(ready = true) {
  let request, destination, layers = ['school'], list = false;
  const jsx = (type, props) => ({ type, props });
  const selection = { kind: 'radius', source: 'place', placeId: 'home', latitude: -22.9, longitude: -43.2, radiusMeters: 1000, neighborhood: null };
  const code = ts.transpileModule(fs.readFileSync('app/(tabs)/index.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mod = { exports: {} };
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})')((name) => {
    if (name === 'react') return { useState: (init) => [init, () => {}] };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return { View: 'View', ScrollView: 'ScrollView', Pressable: 'Pressable', RefreshControl: 'RefreshControl' };
    if (name === 'expo-router') return { router: { push: value => { destination = value; } }, useIsFocused: () => true };
    if (name === '@/theme') return { spacing: {}, useTheme: () => ({ colors: {} }) };
    if (name === '@/features/city/useOfficialCalls') return {
      useOfficialCalls: (...args) => { request = args; return { refetch: () => {}, data: { calls: [] } }; },
      useOfficialFilters: () => ({}), useOfficialOverview: () => ({}), useSyncStatus: () => ({}),
    };
    if (name === '@/features/places/useTerritoryFilters') return { useTerritoryFilters: () => ({ selection, hydrated: ready, cacheScope: 'a:3304557', params: { centerLatitude: -22.9, centerLongitude: -43.2, radiusMeters: 1000 }, search: '', serviceType: 'all', status: 'all', period: 'all', setFilter: () => {} }) };
    if (name === '@/stores/territoryStore') return { useTerritoryStore: { getState: () => ({ setIsListView: v => { list = v; }, setLayers: v => { layers = v; } }) } };
    if (name === '@/stores/followStore') return { useFollowStore: fn => fn({ savedCalls: [{ id: 'saved-outside-radius' }], hydrated: true }) };
    if (name === '@/hooks/useDebouncedValue') return { useDebouncedValue: value => value };
    if (name === '@/features/territory/selectors') return { TERRITORY_PERIOD_OPTIONS: [], TERRITORY_STATUS_OPTIONS: [] };
    const component = name.split('/').at(-1); return { [component]: component, QueryState: 'QueryState' };
  }, mod, mod.exports);
  const tree = mod.exports.default();
  function nodes(value) { return value ? [value, ...[value.props?.children].flat(Infinity).filter(x => x && typeof x === 'object').flatMap(nodes)] : []; }
  return { nodes: nodes(tree), query: () => request, state: () => ({ layers, list, destination }) };
}
test('home exploration enables 1746 and explicitly replaces an old map viewport', () => {
  const home = setup();
  home.nodes.find(n => n.props?.title === 'Explorar no mapa').props.onPress();
  const state = home.state();
  assert.deepEqual(state.layers, ['official']); assert.equal(state.list, false);
  assert.equal(state.destination.pathname, '/(tabs)/TerritoryScreen');
  assert.ok(state.destination.params.fromHome);
  home.nodes.find(n => n.props?.title === 'Ver lista').props.onPress();
  assert.equal(home.state().list, true);
});
test('home limits nearby calls and keeps followed calls independent of the radius', () => {
  const home = setup(); const [params, enabled, scope] = home.query();
  assert.equal(params.limit, 5); assert.equal(params.radiusMeters, 1000); assert.equal(params.neighborhoodId, undefined);
  assert.equal(enabled, true); assert.equal(scope, 'a:3304557');
  const saved = home.nodes.find(n => n.type === 'NearbyCalls' && n.props.calls[0]?.id === 'saved-outside-radius');
  assert.equal(saved.props.selection.kind, 'municipality');
  assert.equal(setup(false).query()[1], false, 'a pending capture cannot fetch the municipality as a fallback');
});
