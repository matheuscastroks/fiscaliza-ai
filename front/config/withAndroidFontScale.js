const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

module.exports = function withAndroidFontScale(config) {
  return withAndroidManifest(config, (config) => {
    const { $: attributes } = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    const changes = (attributes['android:configChanges'] ?? '').split('|').filter(Boolean);
    // Tamanho de texto e de exibição mudam o layout sem recriar o root do Expo Router.
    attributes['android:configChanges'] = [...new Set([...changes, 'fontScale', 'density'])].join('|');
    return config;
  });
};
