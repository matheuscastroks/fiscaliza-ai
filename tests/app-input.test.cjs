const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
  const states = [];
  let cursor = 0;
  const react = {
    useRef: () => ({ current: null }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [
        states[index],
        (next) => {
          states[index] =
            typeof next === 'function' ? next(states[index]) : next;
        },
      ];
    },
  };
  const jsx = (type, props) => ({ type, props });
  const module = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync('components/ui/AppInput.tsx', 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native')
        return {
          View: 'View',
          TextInput: 'TextInput',
          Pressable: 'Pressable',
          StyleSheet: { create: (x) => x },
        };
      if (name === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
      if (name === '@/theme/useTheme')
        return {
          useTheme: () => ({ colors: {}, mode: 'light' }),
          useThemedStyles: () => ({}),
        };
      if (name === './AppText') return { AppText: 'AppText' };
      if (name === './KeyboardAwareScrollView')
        return { useKeyboardAwareInput: () => null };
      if (name === '@/theme/spacing') return { spacing: {} };
      if (name === '@/theme/layout')
        return { layout: { radius: {}, borderWidth: {}, touchTarget: {} } };
      if (name === '@/theme/typography') return { fontFamilies: {} };
      throw new Error(name);
    },
  });
  return (props) => {
    cursor = 0;
    return module.exports.AppInput(props);
  };
}

function find(node, type) {
  if (!node || typeof node !== 'object') return;
  if (node.type === type) return node;
  const children = node.props?.children;
  for (const child of Array.isArray(children)
    ? children.flat(Infinity)
    : [children]) {
    const result = find(child, type);
    if (result) return result;
  }
}

test('passwords start hidden and the eye reveals and hides the existing value', () => {
  const render = setup();
  const props = {
    placeholder: 'Senha',
    secureTextEntry: true,
    value: 'typed-password',
  };
  let tree = render(props);
  assert.equal(find(tree, 'TextInput').props.secureTextEntry, true);
  assert.equal(
    find(tree, 'Pressable').props.accessibilityLabel,
    'Mostrar senha',
  );
  find(tree, 'Pressable').props.onPress();
  tree = render(props);
  assert.equal(find(tree, 'TextInput').props.secureTextEntry, false);
  assert.equal(find(tree, 'TextInput').props.value, props.value);
  assert.equal(
    find(tree, 'Pressable').props.accessibilityLabel,
    'Ocultar senha',
  );
  find(tree, 'Pressable').props.onPress();
  assert.equal(find(render(props), 'TextInput').props.secureTextEntry, true);
});

test('ordinary inputs have no eye and read-only password inputs disable the eye', () => {
  assert.equal(
    find(setup()({ placeholder: 'E-mail' }), 'Pressable'),
    undefined,
  );
  assert.equal(
    find(
      setup()({ placeholder: 'Senha', secureTextEntry: true, editable: false }),
      'Pressable',
    ).props.disabled,
    true,
  );
});
