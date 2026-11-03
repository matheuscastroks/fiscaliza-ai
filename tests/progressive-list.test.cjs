const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('detail collections mount one batch and expose every remaining item on demand', () => {
  let count;
  const mod = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  const source = ts.transpileModule(fs.readFileSync('components/ui/ProgressiveList.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext('(function(require,module,exports){' + source + '\n})')((name) => {
    if (name === 'react') return { useState: initial => {
      if (count === undefined) count = initial;
      return [count, update => { count = update(count); }];
    } };
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'fragment' };
    if (name === './AppButton') return { AppButton: 'button' };
    throw new Error(name);
  }, mod, mod.exports);
  const items = Array.from({ length: 53 }, (_, id) => ({ id }));
  let rendered = [];
  const render = () => {
    rendered = [];
    return mod.exports.ProgressiveList({ items, renderItem: item => { rendered.push(item.id); return item.id; } });
  };
  let tree = render();
  assert.equal(rendered.length, 20, 'hidden comments must not be constructed');
  tree.props.children[1].props.onPress();
  tree = render();
  assert.equal(rendered.length, 40);
  tree.props.children[1].props.onPress();
  tree = render();
  assert.deepEqual(rendered, items.map(item => item.id));
  assert.equal(tree.props.children[1], false, 'no load-more control after the final batch');
});
