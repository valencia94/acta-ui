import { defineConfig } from '@playwright/test';

const PORT = 5173; // dev-server everywhere (CI + local)
const HOST = `http://localhost:${PORT}`;
const TIMEOUT = 60_000;
const HOST = `http://localhost:${PORT}`;
const TIMEOUT = 60_000;

export default defineConfig({
  testDir: './tests',
  timeout: TIMEOUT,
  expect: { timeout: 10_000 },

  /* spin up vite dev-server in both CI and local runs */
  webServer: {
    command: 'vite dev --port 5173 --strictPort',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_API_BASE_URL:
        process.env.VITE_API_BASE_URL ?? 'http://localhost:9999',
    },
    ignoreHTTPSErrors: true,
  },

  use: {
    baseURL: `${HOST}/`,
    headless: true,
    trace: 'on-first-retry',
  },
});
