// tests/setup-playwright.ts
// Global bootstrap for Playwright workers (runs **once** before all tests).

declare global {
  /* Augment the runtime with a mocked Amplify-style Auth */
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

/** Playwright’s global setup (no config arg needed) */
async function globalSetup(): Promise<void> {
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
