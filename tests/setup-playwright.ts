/**
 * tests/setup-playwright.ts
 * Global bootstrap that runs ONCE before any Playwright worker.
 */

import { expect } from '@playwright/test';
import { toHaveNoViolations } from 'jest-axe';

expect.extend({ toHaveNoViolations });

async function globalSetup(): Promise<void> {
  // Mock Amplify Auth (or any other globals) for the entire test run
  // so individual tests don’t need to repeat it.
  // ———
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

