const jestSymbol = Symbol.for('$$jest-matchers-object');
// Playwright bundles its own expect implementation based on jest-extended.
// Vitest uses the same global symbol which may already be defined and locked
// as non-configurable. Deleting it beforehand avoids "Cannot redefine" errors
// when @playwright/test tries to set it up.
if (jestSymbol in global) {
  try {
    // Redefine the symbol with a configurable descriptor so Playwright can
    // override it without throwing.
    Object.defineProperty(global, jestSymbol, {
      configurable: true,
      writable: true,
      value: global[jestSymbol],
    });
  } catch {
    // ignore if redefinition fails
  }
}
