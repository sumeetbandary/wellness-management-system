module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  moduleNameMapper: {
    '^../queues/reportWorker$': '<rootDir>/src/tests/mocks/reportWorker.js'
  }
}; 