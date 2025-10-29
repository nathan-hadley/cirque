const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add cirque-api to watchFolders so Metro can resolve modules from it
config.watchFolders = [path.resolve(__dirname, "../cirque-api")];

// Ensure we can resolve node_modules from both directories
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../cirque-api/node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
