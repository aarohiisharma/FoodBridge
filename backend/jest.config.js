module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/src/tests/integration/'],
  clearMocks: true,
};
