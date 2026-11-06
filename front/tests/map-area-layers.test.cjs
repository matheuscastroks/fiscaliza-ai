const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadLayers() {
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, ...props });
  const palette = { ink: '#111', white: '#fff', surface: '#fafafa' };
  const code = ts.transpileModule(fs.readFileSync('components/territory/MapAreaLayers.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})')((id) => {
    if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
    if (id === '@/theme/colors') return { lightColors: palette, darkColors: palette };
    throw Error(id);
  }, module, module.exports);
  return module.exports;
}
const Mapbox = Object.fromEntries(['ShapeSource', 'CircleLayer', 'FillLayer', 'LineLayer', 'SymbolLayer'].map(key => [key, key]));

test('the query boundary and GPS accuracy remain separate geographic layers', () => {
  const { MapAreaLayers } = loadLayers();
  const searchCircle = { id: 'query' }, accuracyCircle = { id: 'gps' };
  const { children } = MapAreaLayers({ Mapbox, searchCircle, accuracyCircle, isDark: false });
  assert.equal(children[0].shape, searchCircle);
  assert.equal(children[1].shape, accuracyCircle);
  assert.equal(children[0].children[0].type, 'FillLayer');
  assert.equal(children[0].children[1].type, 'LineLayer');
  assert.equal(children[1].children[0].style.fillColor, '#1677EB');
});

test('the saved-place center and device fix are independent, unclustered sources', () => {
  const { MapPositionLayers } = loadLayers();
  const centerPoint = { id: 'home' }, devicePoint = { id: 'device' };
  const { children } = MapPositionLayers({ Mapbox, centerPoint, devicePoint, isDark: false });
  assert.equal(children[0].shape, centerPoint);
  assert.equal(children[1].shape, devicePoint);
  assert.equal(children[0].cluster, undefined);
  assert.equal(children[1].cluster, undefined);
  assert.equal(children[0].children[1].style.textField, 'Centro do entorno');
  assert.equal(children[1].children.style.circleColor, '#1677EB');
  assert.deepEqual(MapPositionLayers({ Mapbox, centerPoint: null, devicePoint: null, isDark: false }).children, [null, null]);
});
