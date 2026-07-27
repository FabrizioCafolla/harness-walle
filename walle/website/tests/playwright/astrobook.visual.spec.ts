import { test, expect } from "@playwright/test";
import { storyRoutes } from "./storyRoutes";

// Astrobook visual regression — compares story preview screenshots against
// stored baselines. Routes are auto-discovered (see storyRoutes.ts): one
// screenshot per story module (its first story, sorted), named after the module.
//
// First run / intentional changes: just astrobook-update-snapshots
// Subsequent runs: just astrobook-test

/** First story of each module: "features/carousel/single-slide" -> keyed by "features/carousel". */
function moduleRepresentatives() {
  const byModule = new Map<string, { id: string; path: string }>();
  for (const route of storyRoutes()) {
    const moduleId = route.id.split("/").slice(0, 2).join("/");
    if (!byModule.has(moduleId)) byModule.set(moduleId, route);
  }
  return [...byModule.entries()];
}

test.describe("Astrobook visual regression", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const [moduleId, route] of moduleRepresentatives()) {
    test(moduleId, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      // Guard against route drift: never snapshot astrobook's not-found fallback.
      expect(
        await page.locator("pre", { hasText: /^Path: \// }).count(),
        "page is astrobook's not-found fallback — story route scheme changed"
      ).toBe(0);
      await expect(page.locator("body")).toHaveScreenshot(`${moduleId.replace("/", "-")}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
