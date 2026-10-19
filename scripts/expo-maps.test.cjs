const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function evaluateTs(filePath) {
  const source = ts.transpileModule(fs.readFileSync(filePath, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const mod = { exports: {} };
  const fn = vm.runInNewContext(
    '(function(require,module,exports){' + source + '\n})',
    {},
  );
  fn(require, mod, mod.exports);
  return mod.exports;
}

test('package.json and app.json register expo-maps and remove react-native-maps', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.ok(pkg.dependencies['expo-maps'], 'expo-maps should be installed');
  assert.equal(
    pkg.dependencies['react-native-maps'],
    undefined,
    'react-native-maps should be removed',
  );

  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const mapsPlugin = appJson.expo.plugins.find(
    (p) => (Array.isArray(p) ? p[0] : p) === 'expo-maps',
  );
  assert.ok(mapsPlugin, 'expo-maps plugin should be registered in app.json');
  assert.equal(mapsPlugin[1].requestLocationPermission, true);
  assert.ok(mapsPlugin[1].locationPermission.includes('localização'));

  const resolvedConfig = require('../app.config.js')({ config: appJson.expo });
  const resolvedMapsPlugin = resolvedConfig.plugins.find(
    (p) => (Array.isArray(p) ? p[0] : p) === 'expo-maps',
  );
  assert.ok(
    resolvedMapsPlugin,
    'app.config.js should preserve the expo-maps config plugin',
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

test('TerritoryScreen and LocationStep use AppleMaps.View and GoogleMaps.View from expo-maps', () => {
  const territorySource = fs.readFileSync(
    'app/(tabs)/TerritoryScreen.tsx',
    'utf8',
  );
  const locationSource = fs.readFileSync(
    'features/reports/LocationStep.tsx',
    'utf8',
  );

  for (const [name, source] of [
    ['TerritoryScreen.tsx', territorySource],
    ['LocationStep.tsx', locationSource],
  ]) {
    assert.ok(
      !source.includes('react-native-maps'),
      `${name} should not reference react-native-maps`,
    );
    assert.ok(
      source.includes("requireOptionalNativeModule('ExpoMaps')") &&
        source.includes("require('expo-maps')"),
      `${name} should guard require('expo-maps') with requireOptionalNativeModule('ExpoMaps')`,
    );
    assert.ok(
      source.includes('AppleMaps.View') && source.includes('GoogleMaps.View'),
      `${name} should render AppleMaps.View on iOS and GoogleMaps.View on Android`,
    );
  }
});
