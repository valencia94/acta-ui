import type { PlaywrightTestConfig } from '@playwright/test';

const url = 'http://localhost:5173';
const baseURL = `${url}/`;
const timeout = 30000;
const globalTimeout = 120000;

const config: PlaywrightTestConfig = {
  timeout,
  globalTimeout,
  expect: {
    timeout,
  },
  webServer: {
    timeout,
    url,
    command: 'pnpm run dev -- --port 5173 --strictPort',
    env: { VITE_API_BASE_URL: 'http://localhost:9999', VITE_SKIP_AUTH: 'true' },
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
  },
  use: {
    baseURL,
    actionTimeout: timeout,
    navigationTimeout: timeout,
    headless: true,
    ignoreHTTPSErrors: true,
  },
};

export default config;
