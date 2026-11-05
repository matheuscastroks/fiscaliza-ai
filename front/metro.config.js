const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

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
  'back',
  'municipal',
  '.agents',
  '.validation',
].map(
  (folder) =>
    new RegExp('^' + escapeRegExp(path.join(repositoryRoot, folder)) + '[\\\\/].*'),
);

module.exports = config;
