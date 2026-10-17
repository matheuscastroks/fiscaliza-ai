module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_KEY;

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...(config.android?.config || {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...config.ios,
      config: {
        ...(config.ios?.config || {}),
        googleMapsApiKey: googleMapsApiKey,
      },
    },
    extra: {
      ...(config.extra || {}),
      googleMapsApiKey,
      geminiApiKey,
    },
  };
};
