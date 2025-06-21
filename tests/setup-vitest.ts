/**
 * tests/setup-vitest.ts
 * Runs ONLY when you execute `pnpm run test:vitest`
 * Adds DOM matchers (jest-dom) & extra expect power for unit tests.
 */

import '@testing-library/jest-dom/vitest'; // 🍒 expect(element).toBeVisible() etc.
