import { getViteConfig } from "astro/config";

// getViteConfig loads the project's astro.config.mjs so vitest can process .astro
// files through the Container API (astro/container).
export default getViteConfig({
  test: {
    // Scoped to unit specs only: tests/playwright/*.test.ts are Playwright specs
    // (a different runner/API) and must never be picked up here.
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
