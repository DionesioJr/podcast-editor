const { compilerOptions } = require('./tsconfig.json');

const toJestPattern = (target) =>
  `<rootDir>/${target.replace(/^\.\//, '').replace('*', '$1')}`;

module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@src/(.*)$': toJestPattern(compilerOptions.paths['@src/*'][0]),
    '^@/(.*)$': toJestPattern(compilerOptions.paths['@/*'][0]),
  },
};
