import { defineConfig } from '@playwright/test';

const PORT  = process.env.CI ? 4173 : 5173;
const HOST  = `http://localhost:${PORT}`;
const TIME  = 60_000;

export default defineConfig({
  globalSetup: './tests/setup-playwright.ts',  // ← new bootstrap
  testDir: './tests',
  timeout: TIME,
  expect: { timeout: 10_000 },

  webServer: {
    command: process.env.CI
      ? 'vite preview --port 4173 --strictPort'
      : 'vite dev --port 5173 --strictPort',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: TIME,
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
