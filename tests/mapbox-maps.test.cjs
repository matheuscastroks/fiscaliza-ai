const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function evaluateTs(filePath, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
    },
  }).outputText;
  const mod = { exports: {} };
  const customRequire = (id) => {
    if (id in mocks) return mocks[id];
    return require(id);
  };
  const fn = vm.runInNewContext(
    '(function(require,module,exports,process){' + source + '\n})',
    {},
  );
  fn(customRequire, mod, mod.exports, process);
  return mod.exports;
}

test('package.json and app.json register @rnmapbox/maps and remove legacy map packages', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.ok(
    pkg.dependencies['@rnmapbox/maps'],
    '@rnmapbox/maps should be installed',
  );
  assert.ok(pkg.dependencies['mapbox-gl'], 'mapbox-gl should be installed');
  assert.equal(
    pkg.dependencies['expo-maps'],
    undefined,
    'expo-maps should be removed',
  );
  assert.equal(
    pkg.dependencies['react-native-maps'],
    undefined,
    'react-native-maps should be removed',
  );
  assert.equal(
    fs.existsSync('components/ui/OsmMapView.tsx'),
    false,
    'legacy OsmMapView.tsx must be removed',
  );

  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const mapboxPlugin = appJson.expo.plugins.find(
    (p) => (Array.isArray(p) ? p[0] : p) === '@rnmapbox/maps',
  );
  assert.ok(
    mapboxPlugin,
    '@rnmapbox/maps plugin should be registered in app.json',
  );

  const resolvedConfig = require('../app.config.js')({ config: appJson.expo });
  const resolvedMapboxPlugin = resolvedConfig.plugins.find(
    (p) => (Array.isArray(p) ? p[0] : p) === '@rnmapbox/maps',
  );
  assert.ok(
    resolvedMapboxPlugin,
    'app.config.js should preserve the @rnmapbox/maps config plugin',
  );
  assert.equal(
    resolvedConfig.android?.config?.googleMaps,
    undefined,
    'legacy googleMaps config must not remain in app.config.js',
  );
});

test('regionToCameraPosition converts region deltas to bounded zoom and coordinates', () => {
  const {
    municipalityRegion,
    regionToCameraPosition,
  } = evaluateTs('features/city/municipalContext.ts');

  const cityRegion = municipalityRegion({
    id: '3550308',
    name: 'São Paulo',
    state: 'SP',
    center: { latitude: -23.5505, longitude: -46.6333 },
    bounds: {
      north: -23.35,
      south: -23.75,
      east: -46.36,
      west: -46.82,
    },
  });
  const cityCamera = regionToCameraPosition(cityRegion);
  assert.equal(cityCamera.coordinates.latitude, -23.5505);
  assert.equal(cityCamera.coordinates.longitude, -46.6333);
  assert.ok(cityCamera.zoom >= 9 && cityCamera.zoom <= 13);

  const streetCamera = regionToCameraPosition({
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });
  assert.equal(streetCamera.zoom, 15);
});

test('all map screens and components integrate MapboxMapView with zero legacy remnants', () => {
  for (const filePath of [
    'app/(tabs)/TerritoryScreen.tsx',
    'features/reports/LocationStep.tsx',
    'components/territory/FacilityDetails.tsx',
    'components/ui/ItemLocationMap.tsx',
  ]) {
    const source = fs.readFileSync(filePath, 'utf8');
    assert.ok(
      !source.includes('OsmMapView'),
      `${filePath} must not reference OsmMapView`,
    );
    assert.ok(
      !source.includes('expo-maps'),
      `${filePath} must not reference expo-maps`,
    );
    assert.ok(
      !source.includes('react-native-maps'),
      `${filePath} must not reference react-native-maps`,
    );
    assert.ok(
      source.includes('MapboxMapView'),
      `${filePath} must integrate MapboxMapView`,
    );
  }
});
