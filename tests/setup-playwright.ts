/**
 * tests/setup-playwright.ts
 * Global bootstrap for Playwright workers ­— runs **once** before any test.
 */

import type { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig): Promise<void> {
  // Mock Amplify Auth (or other globals) for the entire E2E run.
  (globalThis as any).Auth = {
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
