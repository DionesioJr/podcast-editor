module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
};
