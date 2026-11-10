const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertReleaseApiUrl } = require('../config/releaseGuard');

test('release guard: desenvolvimento é livre, release exige https público', () => {
  assert.doesNotThrow(() => assertReleaseApiUrl({ EXPO_PUBLIC_API_URL: 'http://localhost:3001/api' }));
  assert.doesNotThrow(() =>
    assertReleaseApiUrl({ EAS_BUILD_PROFILE: 'development', EXPO_PUBLIC_API_URL: 'http://localhost:3001/api' }),
  );
  assert.doesNotThrow(() =>
    assertReleaseApiUrl({ EAS_BUILD_PROFILE: 'production', EXPO_PUBLIC_API_URL: 'https://api.example.com/api' }),
  );
  for (const url of [
    '',
    'não é url',
    'http://api.example.com/api',
    'https://localhost:3001/api',
    'https://192.168.1.10/api',
    'https://127.0.0.1/api',
    'https://minha-maquina.local/api',
  ])
    assert.throws(
      () => assertReleaseApiUrl({ EAS_BUILD_PROFILE: 'preview', EXPO_PUBLIC_API_URL: url }),
      /EXPO_PUBLIC_API_URL/,
      url,
    );
});
