/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// getViteConfig loads the project's astro.config.mjs so vitest can process .astro
// files through the Container API (astro/container). The triple-slash reference pulls in
// vitest's `declare module "vite" { interface UserConfig { test?: ... } }` augmentation:
// without it, TS only sees Vite's own UserConfig type and rejects the `test` key below.
export default getViteConfig({
  test: {
    // Scoped to unit specs only: tests/playwright/*.test.ts are Playwright specs
    // (a different runner/API) and must never be picked up here.
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
