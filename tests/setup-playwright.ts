/**
 * tests/setup-playwright.ts
 * Global bootstrap for Playwright workers (E2E).
 * NO jest-dom import here – Playwright already bundles its own expect.
 */

import type { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  // Mock Amplify Auth or any other globals **once** before the workers start.
  // (If you previously used page.addInitScript in every test, you can keep that;
  // but this single place is often cleaner.)
  globalThis.Auth = {
    signIn: async () => {
      localStorage.setItem('ikusi.jwt', 'mock-token');
      return { username: 'mock-user' };
    },
    currentSession: async () => ({
      getIdToken: () => ({ getJwtToken: () => 'mock-token' }),
    }),
  };
}

export default globalSetup;
