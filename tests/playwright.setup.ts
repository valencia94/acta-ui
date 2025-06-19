const jestSymbol = Symbol.for('$$jest-matchers-object');
try {
  delete (globalThis as Record<symbol, unknown>)[jestSymbol];
} catch {
  // ignore if cannot delete
}
export default async () => {};
