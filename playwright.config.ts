import { defineConfig } from '@playwright/test';

const PORT = process.env.CI ? 4173 : 5173; // 4173 when running in CI
const HOST = `http://localhost:${PORT}`;
const TIMEOUT = 60_000; // test & action timeout
const EXPECT_TIMEOUT = 10_000; // individual expect timeout

export default defineConfig({
  timeout: TIMEOUT,
  globalTimeout: 2 * TIMEOUT, // 2-minute worker cap
  globalSetup: './tests/playwright.setup.ts',

  testDir: './tests',
  testMatch: ['**/e2e.spec.ts'],

  expect: { timeout: EXPECT_TIMEOUT },

  /* ─────────────  Local dev vs CI  ───────────── */
  webServer: {
    command: process.env.CI
      ? 'vite preview --port 4173 --strictPort' // serve built bundle in CI
      : 'vite dev --port 5173 --strictPort', // dev-server locally
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000, // wait up to 60 s for server
    env: {
      VITE_API_BASE_URL:
        process.env.VITE_API_BASE_URL ?? 'http://localhost:9999',
    },
    ignoreHTTPSErrors: true,
  },

  use: {
    baseURL: `${HOST}/`,
    headless: true,
    actionTimeout: TIMEOUT,
    navigationTimeout: TIMEOUT,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
});
