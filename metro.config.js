const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Habilitar conditional exports para resolver problemas com @google/genai
config.resolver.unstable_enablePackageExports = true;
// Separate services and vendored instructions are not mobile bundle inputs.
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  'backend',
  'municipal',
  '.agents',
  '.validation',
].map(
  (folder) =>
    new RegExp('^' + escapeRegExp(path.join(__dirname, folder)) + '[\\\\/].*'),
);

module.exports = config;
