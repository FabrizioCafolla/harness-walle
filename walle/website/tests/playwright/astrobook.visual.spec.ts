import { test, expect } from "@playwright/test";

// Astrobook visual regression — compares component story screenshots against stored baselines.
// First run: yarn playwright test --config playwright.astrobook.config.ts --update-snapshots
// Subsequent runs: yarn playwright test --config playwright.astrobook.config.ts

test.describe("Astrobook visual regression", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("Button stories", async ({ page }) => {
    await page.goto("/astrobook/elements/Button");
    await expect(page.locator("body")).toHaveScreenshot("button-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("Badge stories", async ({ page }) => {
    await page.goto("/astrobook/elements/Badge");
    await expect(page.locator("body")).toHaveScreenshot("badge-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("Navbar standard stories", async ({ page }) => {
    await page.goto("/astrobook/features/Navbar");
    await expect(page.locator("body")).toHaveScreenshot("navbar-standard-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("Navbar minimal stories", async ({ page }) => {
    await page.goto("/astrobook/features/Navbar.minimal");
    await expect(page.locator("body")).toHaveScreenshot("navbar-minimal-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("Footer standard stories", async ({ page }) => {
    await page.goto("/astrobook/features/Footer");
    await expect(page.locator("body")).toHaveScreenshot("footer-standard-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("Footer minimal stories", async ({ page }) => {
    await page.goto("/astrobook/features/Footer.minimal");
    await expect(page.locator("body")).toHaveScreenshot("footer-minimal-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("BasicCard stories", async ({ page }) => {
    await page.goto("/astrobook/features/BasicCard");
    await expect(page.locator("body")).toHaveScreenshot("basiccard-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("Section stories", async ({ page }) => {
    await page.goto("/astrobook/features/Section");
    await expect(page.locator("body")).toHaveScreenshot("section-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("Breadcrumbs stories", async ({ page }) => {
    await page.goto("/astrobook/features/Breadcrumbs");
    await expect(page.locator("body")).toHaveScreenshot("breadcrumbs-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("SectionFlow stories", async ({ page }) => {
    await page.goto("/astrobook/features/SectionFlow");
    await expect(page.locator("body")).toHaveScreenshot("sectionflow-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("SectionHeaderStandard stories", async ({ page }) => {
    await page.goto("/astrobook/features/SectionHeaderStandard");
    await expect(page.locator("body")).toHaveScreenshot("sectionheaderstandard-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("BlogArticleNavigation stories", async ({ page }) => {
    await page.goto("/astrobook/features/BlogArticleNavigation");
    await expect(page.locator("body")).toHaveScreenshot("blogarticlenavigation-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("BlogFilters stories", async ({ page }) => {
    await page.goto("/astrobook/features/BlogFilters");
    await expect(page.locator("body")).toHaveScreenshot("blogfilters-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("BlogReadingProgress stories", async ({ page }) => {
    await page.goto("/astrobook/features/BlogReadingProgress");
    await expect(page.locator("body")).toHaveScreenshot("blogreadingprogress-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("BlogTableOfContents stories", async ({ page }) => {
    await page.goto("/astrobook/features/BlogTableOfContents");
    await expect(page.locator("body")).toHaveScreenshot("blogtableofcontents-stories.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
