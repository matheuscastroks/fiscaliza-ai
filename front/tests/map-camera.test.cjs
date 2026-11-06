const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

function harness() {
  const refs = [], effects = [], commands = [];
  let cursor = 0;
  const bounds = { northEast: [-43.1, -22.8], southWest: [-43.3, -23] };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('features/territory/useMapCamera.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})')(id => {
    if (id === './mapArea') return { circleBounds: () => bounds };
    if (id === 'react') return {
      useRef(value) { const index = cursor++; return refs[index] ||= { current: value }; },
      useEffect(fn, deps) {
        const index = cursor++;
        const previous = refs[index];
        refs[index] = deps;
        if (!previous || deps.some((value, i) => value !== previous[i])) effects.push(fn);
      },
    };
    throw Error(id);
  }, module, module.exports);
  const camera = { current: {
    setCamera: config => commands.push(['center', config]),
    fitBounds: (...args) => commands.push(['fit', ...args]),
  } };
  return {
    commands, bounds,
    render(target, circle, fit, key) {
      cursor = 0;
      module.exports.useMapCamera(camera, target, circle, fit, key);
      effects.splice(0).forEach(effect => effect());
    },
  };
}
test('a new radius fits completely, explicit cluster zoom still works, same-point recapture refits', () => {
  const h = harness(), circle = {};
  const initial = { latitude: -22.9, longitude: -43.2, zoom: 15 };
  h.render(initial, circle, true, 1);
  assert.deepEqual(h.commands, [['fit', h.bounds.northEast, h.bounds.southWest, [176, 32, 164, 32], 350]]);
  h.render(initial, circle, true, 1);
  assert.equal(h.commands.length, 1, 'unrelated renders preserve the viewport');
  h.render({ ...initial, zoom: 17 }, circle, true, 1);
  assert.equal(h.commands.at(-1)[0], 'center');
  assert.equal(h.commands.at(-1)[1].zoomLevel, 17);
  h.render({ ...initial, zoom: 17 }, circle, true, 2);
  assert.equal(h.commands.at(-1)[0], 'fit', 'same coordinates with a fresh capture recenter after a pan');
  h.render({ ...initial, latitude: -22.91 }, {}, true, 2);
  assert.equal(h.commands.at(-1)[0], 'fit', 'new area wins over accompanying region');
});
test('focused calls and bbox keep explicit camera navigation', () => {
  const h = harness();
  const initial = { latitude: -22.9, longitude: -43.2, zoom: 15 };
  h.render(initial, {}, false);
  h.render({ ...initial, zoom: 18 }, {}, false);
  assert.equal(h.commands.length, 1);
  assert.equal(h.commands[0][0], 'center');
});
