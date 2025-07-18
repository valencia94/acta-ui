const jestSymbol = Symbol.for("$$jest-matchers-object");
// Global setup runs before Playwright installs its expect globals.
// Ensure any previous Vitest hooks are removed to prevent property redefinition errors.
try {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete (globalThis as Record<symbol, unknown>)[jestSymbol];
} catch {
  // ignore if cannot delete
}
export default async () => {};
