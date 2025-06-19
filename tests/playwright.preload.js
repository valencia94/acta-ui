const jestSymbol = Symbol.for('$$jest-matchers-object');
// Playwright bundles its own expect implementation based on jest-extended.
// Vitest uses the same global symbol which may already be defined and locked
// as non-configurable. Deleting it beforehand avoids "Cannot redefine" errors
// when @playwright/test tries to set it up.
if (jestSymbol in global) {
  try {
    // remove the property so Playwright can define it again
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete global[jestSymbol];
  } catch {
    // ignore if deletion fails
  }
}
