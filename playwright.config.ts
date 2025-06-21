import { defineConfig } from '@playwright/test';

const PORT = process.env.CI ? 4173 : 5173;
const HOST = `http://localhost:${PORT}`;

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default defineConfig({
  timeout: 60_000,
  globalTimeout: 120_000,
  globalSetup: './tests/playwright.setup.ts',

  testDir: './tests',
  testMatch: ['**/e2e.spec.ts'],
  expect: { timeout: 10_000 },

  webServer: {
    command: process.env.CI
      ? 'vite preview --port 4173 --strictPort'
      : 'vite dev --port 5173 --strictPort',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_API_BASE_URL:
        process.env.VITE_API_BASE_URL ?? 'http://localhost:9999',
    },
  },

  use: {
    baseURL: `${HOST}/`,
    headless: true,
    trace: 'on-first-retry',
  },
});
