import { defineConfig } from '@playwright/test';

const PORT = process.env.CI ? 4173 : 5173;
const HOST = `http://localhost:${PORT}`;   // ← keep this one
const TIMEOUT = 60_000;                    // ← keep this one
const EXPECT_TIMEOUT = 10_000;

export default defineConfig({
  testDir: './tests',
  timeout: TIMEOUT,
  expect: { timeout: EXPECT_TIMEOUT },

  webServer: {
    command: process.env.CI
      ? 'vite preview --port 4173 --strictPort'
      : 'vite dev --port 5173 --strictPort',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_BASE_URL:
        process.env.VITE_API_BASE_URL ?? 'http://localhost:9999',
    },
    timeout: 60_000,
  },

  use: {
    baseURL: `${HOST}/`,
    headless: true,
    trace: 'on-first-retry',
  },
});
