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
  path.join(repositoryRoot, 'back'),
  path.join(repositoryRoot, 'municipal'),
  path.join(repositoryRoot, '.validation'),
  path.join(__dirname, '.agents'),
  path.join(__dirname, '.impeccable'),
].map((folder) => new RegExp('^' + escapeRegExp(folder) + '[\\\\/].*'));

module.exports = config;
