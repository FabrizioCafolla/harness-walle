import { test, expect } from "@playwright/test";
import { storyRoutes } from "./storyRoutes";

// Astrobook visual regression: compares story preview screenshots against
// stored baselines. Routes are auto-discovered (see storyRoutes.ts): one
// screenshot per story (every export in every *.stories.ts file), named after
// its full route id.
//
// First run / intentional changes: just astrobook-update-snapshots
// Subsequent runs: just astrobook-test

test.describe("Astrobook visual regression", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const route of storyRoutes()) {
    test(route.id, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      // Guard against route drift: never snapshot astrobook's not-found fallback.
      expect(
        await page.locator("pre", { hasText: /^Path: \// }).count(),
        "page is astrobook's not-found fallback: story route scheme changed"
      ).toBe(0);
      await expect(page.locator("body")).toHaveScreenshot(`${route.id.replace(/\//g, "-")}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
