const jestSymbol = Symbol.for('$$jest-matchers-object');
if (jestSymbol in global) {
  try {
    const val = global[jestSymbol];
    Object.defineProperty(global, jestSymbol, { configurable: true, writable: true, value: val });
  } catch {}
}
