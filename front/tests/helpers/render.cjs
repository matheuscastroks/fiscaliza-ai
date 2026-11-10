// Renderizador mínimo de componentes React Native para `node --test` (sem Jest nem Babel).
// Carrega o .tsx com TypeScript, troca react-native/tema por mocks e expande componentes de função
// numa árvore { type, props } que dá para consultar por papel, rótulo e estado.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..', '..');
const colors = new Proxy({}, { get: (_, key) => `#${String(key)}` });

function createRuntime(extraMocks = {}) {
  const cache = new Map();
  const state = { values: [], cursor: 0 };

  const jsx = (type, props) => {
    if (typeof type === 'function') return type(props || {});
    return { type, props: props || {} };
  };
  const react = {
    __esModule: true,
    default: {
      Fragment: 'Fragment',
      Children: { toArray: (children) => [children].flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false) },
      memo: (component) => component,
      useState: (initial) => {
        const index = state.cursor++;
        if (!(index in state.values)) state.values[index] = initial;
        return [state.values[index], (next) => { state.values[index] = typeof next === 'function' ? next(state.values[index]) : next; }];
      },
    },
  };
  react.default.useState = react.default.useState.bind(null);
  Object.assign(react, react.default);

  const nativeStrings = ['View', 'Text', 'Pressable', 'ScrollView', 'ActivityIndicator', 'TouchableOpacity'];
  const reactNative = { StyleSheet: { create: (styles) => styles, flatten: (style) => style, hairlineWidth: 1 } };
  for (const name of nativeStrings) reactNative[name] = name;

  const themeMocks = {
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    react,
    'react-native': reactNative,
    '@expo/vector-icons': { Ionicons: 'Ionicons' },
    '@/theme/useTheme': {
      useTheme: () => ({ colors, isDark: false, mode: 'light' }),
      useThemedStyles: (factory) => factory(colors),
    },
    ...extraMocks,
  };

  function resolve(name, fromDir) {
    if (name.startsWith('@/shared/')) return path.join(ROOT, '..', 'shared', name.slice('@/shared/'.length));
    if (name.startsWith('@/')) return path.join(ROOT, name.slice(2));
    return path.resolve(fromDir, name);
  }

  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} };
    cache.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const fromDir = path.dirname(file);
    vm.runInNewContext(code, {
      module: mod,
      exports: mod.exports,
      require(name) {
        if (name in themeMocks) return themeMocks[name];
        if (name.startsWith('@/theme/') || name.startsWith('@/shared/')) return require(resolve(name, fromDir).replace(/\.(ts|tsx)$/, '') + '.ts');
        if (name.startsWith('.') || name.startsWith('@/')) {
          const base = resolve(name, fromDir);
          for (const ext of ['.tsx', '.ts']) if (fs.existsSync(base + ext)) return load(base + ext);
        }
        return require(name);
      },
      console,
    });
    return mod.exports;
  }

  return {
    load: (relative) => load(path.join(ROOT, relative)),
    reset: () => { state.values = []; state.cursor = 0; },
    colors,
  };
}

/** Todos os nós da árvore, em profundidade. */
function nodes(tree) {
  if (tree === null || tree === undefined || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  const children = tree.props && tree.props.children;
  const out = [tree];
  for (const child of [children].flat(Infinity)) out.push(...nodes(child));
  return out;
}

const find = (tree, predicate) => nodes(tree).find(predicate);
const text = (tree) =>
  nodes(tree)
    .map((n) => [n.props?.children].flat(Infinity).filter((c) => typeof c === 'string' || typeof c === 'number').join(''))
    .filter(Boolean)
    .join(' ');

module.exports = { createRuntime, nodes, find, text };
