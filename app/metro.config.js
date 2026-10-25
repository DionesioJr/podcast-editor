const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@': __dirname,
  '@src': path.join(__dirname, 'src'),
};

config.resolver.blockList = [/\.(test|spec)\.[jt]sx?$/];

module.exports = config;
