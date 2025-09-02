import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    testTimeout: 10000,
    hookTimeout: 10000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'vitest.config.ts',
        'node_modules/',
        'dist/',
        'build/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'tests/',
        'src/config/',
        'src/types/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
    ],
    exclude: ['node_modules/', 'dist/', 'build/'],

    setupFiles: ['./tests/setup/test-setup.ts'],

    pool: 'forks',
    maxConcurrency: 1,

    reporters: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },

    clearMocks: true,
    restoreMocks: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
