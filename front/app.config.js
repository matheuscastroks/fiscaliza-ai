const { assertReleaseApiUrl } = require('./config/releaseGuard');

module.exports = ({ config }) => {
  assertReleaseApiUrl();
  // Nome único: EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN. Os nomes antigos ainda são
  // aceitos aqui, com aviso, para não quebrar um .env existente.
  const legacyToken = process.env.EXPO_PUBLIC_API_MAPBOX || process.env.MAPBOX;
  if (!process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN && legacyToken) {
    console.warn(
      '[app.config] EXPO_PUBLIC_API_MAPBOX e MAPBOX foram substituídos por EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN. Renomeie no seu .env.',
    );
  }
  const mapboxAccessToken =
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || legacyToken || '';
  const mapboxDownloadToken = process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN;
  const plugins = (config.plugins || []).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== 'expo-image-picker' && name !== '@rnmapbox/maps';
  });
  return {
    ...config,
    userInterfaceStyle: 'automatic',
    plugins: [
      ...plugins,
      [
        'expo-image-picker',
        {
          photosPermission:
            'O Fiscaliza aí acessa suas fotos só quando você escolhe uma imagem para o seu perfil.',
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
      [
        '@sentry/react-native/expo',
        {
          organization: 'instituto-de-pesquisa-economic',
          project: 'fiscaliza-ai',
          // O envio de source maps no build do EAS usa SENTRY_AUTH_TOKEN (secret).
        },
      ],
    ],
    extra: {
      ...(config.extra || {}),
      mapboxAccessToken,
    },
  };
};
