const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

test('initial index route redirects directly to the Map-First TerritoryScreen experience', () => {
  const jsx = (type, props) => ({ type, props });
  const code = ts.transpileModule(
    fs.readFileSync('app/(tabs)/index.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  const mod = { exports: {} };
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})')(
    (name) => {
      if (name === 'react') return {};
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'expo-router') return { Redirect: 'Redirect' };
      throw new Error(`Unexpected dependency in index.tsx: ${name}`);
    },
    mod,
    mod.exports,
  );
  const tree = mod.exports.default();
  assert.equal(tree.type, 'Redirect');
  assert.equal(tree.props.href, '/(tabs)/TerritoryScreen');
});

test('TabLayout starts on TerritoryScreen and TerritoryScreen falls back to list when Mapbox is unavailable', () => {
  const layoutSource = fs.readFileSync('app/(tabs)/_layout.tsx', 'utf8');
  assert.ok(
    layoutSource.includes('anchor: \'TerritoryScreen\'') ||
      layoutSource.includes('initialRouteName="TerritoryScreen"'),
    'TabLayout must set anchor/initialRouteName to TerritoryScreen',
  );
  assert.ok(
    layoutSource.includes('href: null'),
    'index route must be hidden from the tab bar',
  );

  const territorySource = fs.readFileSync('app/(tabs)/TerritoryScreen.tsx', 'utf8') +
    fs.readFileSync('features/territory/useTerritoryController.ts', 'utf8');
  assert.ok(
    territorySource.includes('const mapAvailable = isMapboxAvailable();'),
    'TerritoryScreen must check isMapboxAvailable()',
  );
  assert.ok(
    territorySource.includes(
      'const effectiveListView = isListView || !mapAvailable;',
    ),
    'TerritoryScreen must fall back to list view when native Mapbox is unavailable',
  );
  assert.ok(
    territorySource.includes('hasCoordinates: areaOnly ? true : undefined'),
    'TerritoryScreen must preserve unlocated calls in neighborhood/municipality queries',
  );
});
