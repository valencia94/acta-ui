// tests/smoke.test.ts
/* eslint-disable simple-import-sort/imports */
import { describe, expect, it } from "vitest";

const base = process.env.LIVE_BASE_URL ?? "http://localhost:4173";

describe("CI smoke test", () => {
  const testFn = process.env.LIVE_BASE_URL ? it : it.skip;
  testFn("serves key routes", async () => {
    for (const path of ["/health", "/login", "/dashboard"]) {
      const res = await fetch(`${base}${path}`);
      expect(res.status).toBe(200);
    }
  });
});
/* eslint-enable simple-import-sort/imports */
