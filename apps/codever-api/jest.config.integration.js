module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.integration-test.js'],
  // the suites share the Keycloak test user and its data, so run them one at a time
  maxWorkers: 1,
};
