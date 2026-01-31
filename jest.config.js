/** @type {import('jest').Config} */
export default {
  // Use jsdom for DOM testing (simulates browser environment)
  testEnvironment: 'jsdom',
  
  // Look for test files in __tests__ folders or files with .test.js suffix
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js'
  ],
  
  // Ignore node_modules and build outputs
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Transform ES modules (Jest needs this for import/export)
  transform: {},
  
  // Coverage configuration
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/main.js',  // Entry point, hard to unit test
    '!**/node_modules/**'
  ],
  
  // Coverage thresholds (start low, increase as tests are added)
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  },
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Verbose output for better debugging
  verbose: true
};
