import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ─── keep your current include / exclude ───
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
      '__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['tests/e2e.spec.ts', 'node_modules/**'],

    // ─── new lines (fix double-expect clash) ───
    globals: true,
    setupFiles: ['tests/setup-vitest.ts'],   // path from previous reply
  },
});
