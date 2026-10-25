const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@': __dirname,
  '@src': path.join(__dirname, 'src'),
};

module.exports = config;
