module.exports = {
  collectCoverage: true,
  verbose: true,
  testEnvironment: 'jsdom',
  // setupFiles: ['<rootDir>/test/setEnv.ts'],
  // setupFilesAfterEnv: ['<rootDir>/test/helpers/wait-for-update.ts'],
  // moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/test/**/*.(test|spec).[jt]s?(x)'],
  transform: {},
  globals: {
    'ts-jest': {
      babelConfig: false,
      tsconfig: './tsconfig.jest.json',
      diagnostics: false,
    },
  },
  preset: 'ts-jest',
  coveragePathIgnorePatterns: ['/node_modules/', '/dev/', '/test/', '/esm/', '/lib/', 'package.json', 'yarn.json'],
};
