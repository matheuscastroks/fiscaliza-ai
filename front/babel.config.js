// Compatibility for Bottom Sheet 5.2.14 with Reanimated 4.7 on native.
// Remove after https://github.com/gorhom/react-native-bottom-sheet/issues/2785.
const dependencyIndex = {
  useAnimatedProps: 1,
  useAnimatedReaction: 2,
  useAnimatedScrollHandler: 1,
  useAnimatedStyle: 1,
  useDerivedValue: 1,
};

function bottomSheetNativeDependencies({ types }) {
  return {
    visitor: {
      CallExpression({ node, scope }) {
        if (!types.isIdentifier(node.callee)) return;
        const binding = scope.getBinding(node.callee.name)?.path;
        if (
          !binding?.isImportSpecifier() ||
          binding.parent.source.value !== 'react-native-reanimated'
        ) return;

        const index = dependencyIndex[binding.node.imported.name];
        if (index !== undefined && types.isArrayExpression(node.arguments[index])) {
          // Native hooks treat undefined as omitted. Some still warn for null.
          node.arguments[index] = types.unaryExpression('void', types.numericLiteral(0));
        }
      },
    },
  };
}

module.exports = (api) => {
  const native = api.caller((caller) => caller?.platform === 'android' || caller?.platform === 'ios');
  return {
    presets: ['babel-preset-expo'],
    overrides: native ? [{
      test: /[\\/]node_modules[\\/]@gorhom[\\/]bottom-sheet[\\/]/,
      plugins: [bottomSheetNativeDependencies],
    }] : [],
  };
};
