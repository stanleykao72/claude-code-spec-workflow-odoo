module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Changed to jsdom to support DOM types for dashboard tests
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  // Setup for different test environments
  projects: [
    {
      displayName: 'dashboard',
      testMatch: ['<rootDir>/tests/dashboard/**/*.test.ts'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
    },
    {
      displayName: 'node',
      testMatch: ['<rootDir>/tests/**/*.test.ts'],
      testPathIgnorePatterns: ['<rootDir>/tests/dashboard/'],
      testEnvironment: 'node',
      preset: 'ts-jest',
    }
  ]
};