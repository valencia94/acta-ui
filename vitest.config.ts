import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
      '__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['tests/e2e.spec.ts', 'node_modules/**'],
    globals: true,
    setupFiles: ['tests/setup-vitest.ts'],
  },
});
