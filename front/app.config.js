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
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || config.android?.googleServicesFile,
    },
    userInterfaceStyle: 'automatic',
    plugins: [
      ...plugins,
      './config/withAndroidFontScale',
      [
        'expo-image-picker',
        {
          photosPermission:
            'O Fiscaliza aí acessa suas fotos só quando você escolhe uma imagem para o perfil ou para descrever um problema ao 1746.',
          cameraPermission:
            'O Fiscaliza aí usa a câmera só quando você fotografa um problema para preparar a mensagem ao 1746.',
          microphonePermission: false,
        },
      ],
      // Foto e texto vão juntos para o WhatsApp oficial do 1746.
      [
        'react-native-share',
        { ios: ['whatsapp'], android: ['com.whatsapp', 'com.whatsapp.w4b'] },
      ],
      [
        '@rnmapbox/maps',
        mapboxDownloadToken
          ? { RNMapboxMapsDownloadToken: mapboxDownloadToken }
          : {},
      ],
      'expo-secure-store',
      'expo-status-bar',
      'expo-web-browser',
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
