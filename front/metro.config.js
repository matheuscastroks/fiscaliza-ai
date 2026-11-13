const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('node:path');

// Mesma base do getDefaultConfig da Expo, com os ids de depuração do Sentry
// nos bundles (para os erros apontarem a linha certa do código).
/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// Preserve conditional exports used by the installed Expo SDK.
config.resolver.unstable_enablePackageExports = true;
const repositoryRoot = path.resolve(__dirname, '..');
config.watchFolders = [
  ...(config.watchFolders || []),
  path.join(repositoryRoot, 'shared'),
];

// Separate services and vendored instructions are not mobile bundle inputs.
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  path.join(repositoryRoot, 'back'),
  path.join(repositoryRoot, '.validation'),
  path.join(__dirname, '.agents'),
  path.join(__dirname, '.impeccable'),
].map((folder) => new RegExp('^' + escapeRegExp(folder) + '[\\\\/].*'));

module.exports = config;
