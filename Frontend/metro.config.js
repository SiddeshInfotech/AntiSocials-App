const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude Gradle cache and native Android build output directories from Metro file watching
const customBlockList = [
  /.*[\/\\]\.gradle[\/\\].*/,
  /.*[\/\\]android[\/\\].*[\/\\]build[\/\\].*/,
  /.*[\/\\]android[\/\\]build[\/\\].*/,
  /.*[\/\\]\.kotlin[\/\\].*/,
];

if (Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList.push(...customBlockList);
} else if (config.resolver.blockList) {
  config.resolver.blockList = [config.resolver.blockList, ...customBlockList];
} else {
  config.resolver.blockList = customBlockList;
}

module.exports = config;
