module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const plugins = (config.plugins || []).filter(
    (plugin) =>
      (Array.isArray(plugin) ? plugin[0] : plugin) !== 'expo-image-picker',
  );
  return {
    ...config,
    userInterfaceStyle: 'light',
    plugins: [
      ...plugins,
      [
        'expo-image-picker',
        {
          photosPermission:
            'Permita selecionar fotos para complementar seu registro.',
          microphonePermission: false,
        },
      ],
      'expo-secure-store',
    ],
    android: {
      ...config.android,
      config: {
        ...(config.android?.config || {}),
        googleMaps: { apiKey: googleMapsApiKey },
      },
    },
    ios: {
      ...config.ios,
      config: { ...(config.ios?.config || {}), googleMapsApiKey },
    },
    extra: { ...(config.extra || {}) },
  };
};
