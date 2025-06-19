import { defineConfig } from '@playwright/test';

const PORT = 5173;                         // same everywhere
const HOST = `http://localhost:${PORT}`;
const TIMEOUT = 60_000;

export default defineConfig({
  testDir: './tests',
  timeout: TIMEOUT,
  expect: { timeout: 10_000 },

  /* One command for both local and CI  */
  webServer: {
    // dev-server builds on the fly; works with env vars, SSR, etc.
    command: 'vite dev --port 5173 --strictPort',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_API_BASE_URL:
        process.env.VITE_API_BASE_URL ?? 'http://localhost:9999'
    },
    ignoreHTTPSErrors: true
  },

  use: {
    baseURL: `${HOST}/`,
    headless: true,
    trace: 'on-first-retry'
  }
});
