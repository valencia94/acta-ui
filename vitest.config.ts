// vitest.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup-vitest.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '**/e2e/**',
      '**/playwright.*',
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
    },
  },
});
