const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadMapboxHelpers() {
  const source = ts.transpileModule(
    fs.readFileSync('components/ui/MapboxMapView.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        jsx: ts.JsxEmit.React,
      },
    },
  ).outputText;

  const mod = { exports: {} };
  const mocks = {
    '@/features/territory/useMapCamera': {},
    '@/features/territory/mapArea': {},
    '@/components/territory/MapAreaLayers': {},
    '@/features/territory/mapPerformance': { mapPerformanceEvent() {} },
    react: {
      useCallback: (fn) => fn,
      useEffect: () => {},
      useMemo: (fn) => fn(),
      useRef: (v) => ({ current: v }),
      createElement: () => ({}),
      memo: (c) => c,
    },
    'react-native': {
      NativeModules: {},
      Platform: { OS: 'web' },
      StyleSheet: { create: (s) => s },
      View: 'View',
    },
    'expo-constants': {
      default: { expoConfig: { extra: { mapboxAccessToken: 'pk.test_token' } } },
    },
    'react-native-webview': {
      WebView: 'WebView',
    },
    '@/features/territory/selectors': {
      scriptJson: (v) => JSON.stringify(v),
    },
  };

  const fn = vm.runInThisContext(
    '(function(require,module,exports,process){' + source + '\n})',
  );
  fn(
    (id) => {
      if (id in mocks) return mocks[id];
      return require(id);
    },
    mod,
    mod.exports,
    { env: {} },
  );
  return mod.exports;
}

test('buildMarkersFeatureCollection converts 14,000 markers into a GeoJSON FeatureCollection with selection state', () => {
  const { buildMarkersFeatureCollection, mapboxStyleUrl } = loadMapboxHelpers();
  const markers = Array.from({ length: 14000 }, (_, i) => ({
    id: `call-${i}`,
    latitude: -22.9 - (i % 100) * 0.001,
    longitude: -43.2 - Math.floor(i / 100) * 0.001,
    title: `Chamado ${i}`,
    kind: 'official',
    color: '#0072BB',
  }));

  const collection = buildMarkersFeatureCollection(markers, 'call-42');
  assert.equal(collection.type, 'FeatureCollection');
  assert.equal(collection.features.length, 14000);
  assert.deepEqual(collection.features[42].geometry, {
    type: 'Point',
    coordinates: [markers[42].longitude, markers[42].latitude],
  });
  assert.equal(collection.features[42].properties.selected, 1);
  assert.equal(collection.features[0].properties.selected, 0);
  assert.equal(mapboxStyleUrl(false), 'mapbox://styles/mapbox/streets-v12');
  assert.equal(mapboxStyleUrl(true), 'mapbox://styles/mapbox/dark-v11', 'o mapa acompanha o modo escuro');
});

test('normalizeBoundaryFeatureCollection normalizes raw Polygon, Feature and FeatureCollection', () => {
  const { normalizeBoundaryFeatureCollection } = loadMapboxHelpers();

  const polygon = {
    type: 'Polygon',
    coordinates: [
      [
        [-43.2, -22.9],
        [-43.1, -22.9],
        [-43.1, -22.8],
        [-43.2, -22.9],
      ],
    ],
  };

  const normalized = normalizeBoundaryFeatureCollection(polygon);
  assert.equal(normalized.type, 'FeatureCollection');
  assert.equal(normalized.features.length, 1);
  assert.deepEqual(normalized.features[0].geometry, polygon);

  const empty = normalizeBoundaryFeatureCollection(null);
  assert.deepEqual(empty, { type: 'FeatureCollection', features: [] });
});

test('TerritoryScreen updates viewportRef on pan without triggering state re-renders and delegates list/filters', () => {
  const source = fs.readFileSync('app/(tabs)/TerritoryScreen.tsx', 'utf8') + ['useTerritoryController', 'useTerritoryQueries', 'useTerritoryView'].map((n) => fs.readFileSync(`features/territory/${n}.ts`, 'utf8')).join(String.fromCharCode(10));
  assert.ok(
    source.includes('viewportRef.current = {'),
    'onRegionChange should update viewportRef.current without calling setRegion on every frame',
  );
  assert.ok(
    source.includes('computeRegionBounds(viewportRef.current)'),
    'area search should read bounds from viewportRef.current',
  );
  assert.ok(
    !source.includes('if (!isFocused) return null;'),
    'TerritoryScreen should stay mounted across tab switches to preserve the Mapbox instance',
  );
  assert.ok(
    source.includes('TerritoryListView') &&
      source.includes('TerritoryFilterBar') &&
      source.includes('TerritoryFilterModal'),
    'TerritoryScreen should delegate list and filter controls to dedicated components',
  );
  for (const file of ['app/(tabs)/TerritoryScreen.tsx', 'features/territory/useTerritoryController.ts', 'features/territory/useTerritoryQueries.ts', 'features/territory/useTerritoryView.ts']) {
    const lines = fs.readFileSync(file, 'utf8').split(String.fromCharCode(10)).length;
    assert.ok(lines < 600, `${file} should stay below 600 lines, currently ${lines}`);
  }
});
