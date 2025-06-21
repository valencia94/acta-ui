// tests/setup-playwright.ts
// Global bootstrap for Playwright workers (runs **once** before all tests).

import type { FullConfig } from '@playwright/test';

declare global {
  // Augment the global scope with our mocked Auth shaped as in Amplify.
  // (You can refine types later if needed.)
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Global {
    Auth: {
      signIn: () => Promise<{ username: string }>;
      currentSession: () => Promise<{
        getIdToken: () => { getJwtToken: () => string };
      }>;
    };
  }
}

async function globalSetup(_: FullConfig): Promise<void> {
  /* Mock Amplify-like Auth once for the whole test run */
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
