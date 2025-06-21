import { defineConfig } from "@playwright/test";

const PORT = process.env.CI ? 4173 : 5173;
const HOST = `http://localhost:${PORT}`;
const TIMEOUT = 60_000;
const EXPECT_TIMEOUT = 10_000;

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default defineConfig({
  timeout: TIMEOUT,
  globalTimeout: 2 * TIMEOUT,
  globalSetup: "./tests/setup-playwright.ts",

  testDir: "./tests",
  testMatch: ["**/e2e.spec.ts"],

  expect: { timeout: EXPECT_TIMEOUT },

  /* ------------------------------------------
     Local server for both dev (local runs) and
     preview build (CI) — picked by NODE_ENV
  ------------------------------------------ */
  webServer: {
    command: process.env.CI
      ? "vite preview --port 4173 --strictPort"
      : "vite dev --port 5173 --strictPort",
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_API_BASE_URL:
        process.env.VITE_API_BASE_URL ?? "http://localhost:9999",
    },
    ignoreHTTPSErrors: true,
  },

  use: {
    baseURL: `${HOST}/`,
    headless: true,
    actionTimeout: TIMEOUT,
    navigationTimeout: TIMEOUT,
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
});
