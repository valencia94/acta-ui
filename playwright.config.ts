import { defineConfig } from '@playwright/test';

const PORT = 4173;
const HOST = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },

  webServer: {
    command: 'pnpm exec vite preview --port 4173 --strictPort',
    port: PORT,
    reuseExistingServer: true,
    env: {
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? 'http://localhost:9999',
    },
    timeout: 60_000,
  },

  use: {
    baseURL: `${HOST}/`,
    headless: true,
    trace: 'on-first-retry',
  },
});
