const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
test('typing coalesces search input and cleans the pending timer on unmount', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let value, cleanup;
  const react = {
    useState: (initial) => {
      if (value === undefined) value = initial;
      return [value, (next) => (value = next)];
    },
    useEffect: (fn) => {
      cleanup?.();
      cleanup = fn();
    },
  };
  const source = ts.transpileModule(
    fs.readFileSync('hooks/useDebouncedValue.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const mod = { exports: {} };
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})', {
    setTimeout,
    clearTimeout,
  })(
    (name) => {
      if (name === 'react') return react;
      throw Error(name);
    },
    mod,
    mod.exports,
  );
  const render = mod.exports.useDebouncedValue;
  assert.equal(render('', 300), '');
  render('i', 300);
  t.mock.timers.tick(100);
  render('ilu', 300);
  t.mock.timers.tick(100);
  render('iluminação', 300);
  t.mock.timers.tick(299);
  assert.equal(value, '');
  t.mock.timers.tick(1);
  assert.equal(value, 'iluminação');
  render('novo', 300);
  cleanup();
  t.mock.timers.tick(300);
  assert.equal(value, 'iluminação');
});
