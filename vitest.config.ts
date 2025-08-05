// vitest.config.ts
import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

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
