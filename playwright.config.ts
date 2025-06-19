import { defineConfig } from '@playwright/test';

const PORT = 5173;
const HOST = `http://localhost:${PORT}`;
const TIMEOUT = 60_000;        // test & action timeout (60 s)
const EXPECT_TIMEOUT = 10_000; // individual expect timeout (10 s)

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default defineConfig({
  timeout: TIMEOUT,
  globalTimeout: 2 * TIMEOUT,          // 2 min total per worker
  globalSetup: './tests/playwright.setup.ts',

  testDir: './tests',
  testMatch: ['**/e2e.spec.ts'],

  expect: { timeout: EXPECT_TIMEOUT },

  /* ------------------------------------------
     Local server for both dev (local runs) and
     preview build (CI) — picked by NODE_ENV
  ------------------------------------------ */
  webServer: {
    command: process.env.CI
      ? 'pnpm run preview -- --port 5173 --strictPort'
      : 'pnpm run dev -- --port 5173 --strictPort',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,          // wait up to 60 s for server to be ready
    env: {
      // During local runs hit the mock/stub API
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? 'http://localhost:9999',
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
