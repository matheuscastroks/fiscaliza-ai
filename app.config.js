module.exports = ({ config }) => {
  const mapboxAccessToken =
    process.env.EXPO_PUBLIC_API_MAPBOX ||
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    process.env.MAPBOX ||
    '';
  const mapboxDownloadToken = process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN;
  const plugins = (config.plugins || []).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== 'expo-image-picker' && name !== '@rnmapbox/maps';
  });
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
      [
        '@rnmapbox/maps',
        mapboxDownloadToken
          ? { RNMapboxMapsDownloadToken: mapboxDownloadToken }
          : {},
      ],
      'expo-secure-store',
    ],
    extra: {
      ...(config.extra || {}),
      mapboxAccessToken,
    },
  };
};
