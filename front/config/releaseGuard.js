// Impede publicar um build de release apontando para a API de desenvolvimento.
// Perfis do EAS: development (livre), preview e production (exigem https público).
const RELEASE_PROFILES = new Set(['preview', 'production']);

function assertReleaseApiUrl(env = process.env) {
  const profile = env.EAS_BUILD_PROFILE;
  if (!profile || !RELEASE_PROFILES.has(profile)) return;
  const url = env.EXPO_PUBLIC_API_URL || '';
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `Build "${profile}": defina EXPO_PUBLIC_API_URL com a URL https da API (recebi "${url}").`,
    );
  }
  const local =
    /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\]$)/.test(parsed.hostname) ||
    parsed.hostname.endsWith('.local') ||
    parsed.hostname.endsWith('.localhost');
  if (parsed.protocol !== 'https:' || local)
    throw new Error(
      `Build "${profile}": EXPO_PUBLIC_API_URL deve ser https e público, não "${url}".`,
    );
}

module.exports = { assertReleaseApiUrl, RELEASE_PROFILES };
