import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Scoped to unit specs only — tests/playwright/*.test.ts are Playwright specs
    // (a different runner/API) and must never be picked up here.
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
