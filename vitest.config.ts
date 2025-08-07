// vitest.config.ts
import path from "path";
import { configDefaults,defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup-vitest.ts"],
    exclude: [...configDefaults.exclude, "tests/e2e*.spec.ts", "src/lib/__tests__/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
