import { test, expect } from "@playwright/test";
import { storyRoutes } from "./storyRoutes";

// Visual regression: one screenshot per story route (storyRoutes.ts), named after its id.
// Update baselines: just astrobook-update-snapshots. Run: just astrobook-test

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
      // Threshold: playwright.astrobook.config.ts, an absolute pixel count.
      await expect(page.locator("body")).toHaveScreenshot(`${route.id.replace(/\//g, "-")}.png`);
    });
  }
});
