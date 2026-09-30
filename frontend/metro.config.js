const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix for Windows: Metro tries to watch Gradle build dirs inside node_modules
// that don't exist unless a native Android build has been run, causing ENOENT crashes.
config.resolver = config.resolver || {};
config.resolver.blockList = [
  /node_modules\/.*\/build\/classes\/.*/,
  /node_modules\/.*\/build\/generated\/.*/,
  /node_modules\/.*\/\.gradle\/.*/,
];

module.exports = withNativeWind(config, { input: './global.css' });
