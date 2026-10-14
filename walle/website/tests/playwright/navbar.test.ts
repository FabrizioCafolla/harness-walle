import { expect, test } from "@playwright/test";
import { siteBase } from "./storyRoutes";

// The home page is `/<base>` exactly: app.json sets trailingSlash "never".
const home = siteBase || "/";

test.describe("Navbar - Desktop (1280x800)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("navbar is visible", async ({ page }) => {
    await page.goto(home);
    const navbar = page.locator("nav.main-nav");
    await expect(navbar).toBeVisible();
  });

  test("nav links are visible (no hamburger)", async ({ page }) => {
    await page.goto(home);
    const navLinks = page.locator(".nav-links");
    await expect(navLinks).toBeVisible();
  });

  test("dropdown appears on hover and does not overflow", async ({ page }) => {
    await page.goto(home);
    const blogTrigger = page.locator(".dropdown-trigger").first();
    await blogTrigger.hover();

    const dropdown = page.locator(".dropdown-menu").first();
    await expect(dropdown).toBeVisible();

    const dropdownBox = await dropdown.boundingBox();
    expect(dropdownBox).not.toBeNull();
    expect(dropdownBox!.x + dropdownBox!.width).toBeLessThanOrEqual(1280);
    expect(dropdownBox!.x).toBeGreaterThanOrEqual(0);
  });

  test("dropdown has items", async ({ page }) => {
    await page.goto(home);
    const blogTrigger = page.locator(".dropdown-trigger").first();
    await blogTrigger.hover();

    const dropdown = page.locator(".dropdown-menu").first();
    await expect(dropdown).toBeVisible();

    const itemCount = await dropdown.locator(".dropdown-link").count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test("text nav link's accessible name matches its visible label", async ({ page }) => {
    await page.goto(home);
    // An aria-label like "Go to <href>" would override the visible text (WCAG 2.5.3).
    await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
  });

  test("icon-only nav link keeps a fallback accessible name", async ({ page }) => {
    await page.goto(home);
    const iconLink = page.locator('.nav-link[href*="github.com"]').first();
    await expect(iconLink).toHaveAttribute("aria-label", /.+/);
  });
});

test.describe("Navbar - Mobile (375x667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("hamburger is visible", async ({ page }) => {
    await page.goto(home);
    const hamburger = page.locator("#mobile-menu-toggle");
    await expect(hamburger).toBeVisible();
  });

  test("nav container hidden initially", async ({ page }) => {
    await page.goto(home);
    const navContainer = page.locator(".nav-container");
    await expect(navContainer).not.toBeVisible();
  });

  test("nav container visible after hamburger click", async ({ page }) => {
    await page.goto(home);
    const hamburger = page.locator("#mobile-menu-toggle");
    await hamburger.click();

    const navContainer = page.locator(".nav-container");
    await expect(navContainer).toBeVisible();
  });

  test("nav links do not overflow viewport", async ({ page }) => {
    await page.goto(home);
    const hamburger = page.locator("#mobile-menu-toggle");
    await hamburger.click();

    const navLinks = page.locator(".nav-links");
    const box = await navLinks.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });

  test("dropdown visible after click", async ({ page }) => {
    await page.goto(home);
    const hamburger = page.locator("#mobile-menu-toggle");
    await hamburger.click();

    const blogTrigger = page.locator(".dropdown-trigger").first();
    await blogTrigger.click();

    const dropdown = page.locator(".dropdown-menu").first();
    await expect(dropdown).toBeVisible();
  });

  test("mobile dropdown does not overflow", async ({ page }) => {
    await page.goto(home);
    const hamburger = page.locator("#mobile-menu-toggle");
    await hamburger.click();

    const blogTrigger = page.locator(".dropdown-trigger").first();
    await blogTrigger.click();

    const dropdown = page.locator(".dropdown-menu").first();
    await expect(dropdown).toBeVisible();

    const box = await dropdown.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });
});

test.describe("Navbar - Tablet (768x1024)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("hamburger is visible at tablet breakpoint", async ({ page }) => {
    await page.goto(home);
    const hamburger = page.locator("#mobile-menu-toggle");
    await expect(hamburger).toBeVisible();
  });
});

// A page opts in to the transparent menu by rendering an element with `data-navbar-overlay`
// (its hero). The demo pages have none, so the tests add the marker and the two logos.
test.describe("Navbar - overlay over a dark top", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  const optIn = async (page: import("@playwright/test").Page) => {
    await page.goto(home);
    await page.evaluate(() => {
      const marker = document.createElement("div");
      marker.setAttribute("data-navbar-overlay", "");
      marker.style.cssText = "height:2000px;background:#0b2a5b";
      document.querySelector("main")?.prepend(marker);
      const link = document.querySelector(".brand-link");
      if (link) {
        const svg = (c: string) =>
          `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="${c}"/></svg>`)}`;
        link.innerHTML = `<img class="brand-logo" alt="logo" src="${svg("black")}"><img class="brand-logo brand-logo--inverse" alt="" src="${svg("white")}">`;
      }
    });
  };

  test("at the top the menu is transparent with light links and the inverse logo", async ({
    page,
  }) => {
    await optIn(page);
    const header = page.locator(".site-header");
    await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(page.locator(".nav-link").first()).toHaveCSS(
      "color",
      /rgb\(2(55|54), 2(55|54), 2(55|54)\)/
    );
    await expect(page.locator(".brand-logo--inverse")).toBeVisible();
    await expect(page.locator(".brand-logo:not(.brand-logo--inverse)")).toBeHidden();
  });

  test("after scrolling the menu is solid again with the normal logo", async ({ page }) => {
    await optIn(page);
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(page.locator(".site-header")).toHaveClass(/scrolled/);
    await expect(page.locator(".site-header")).not.toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)"
    );
    await expect(page.locator(".brand-logo:not(.brand-logo--inverse)")).toBeVisible();
    await expect(page.locator(".brand-logo--inverse")).toBeHidden();
  });

  test("a page without the marker keeps the solid menu", async ({ page }) => {
    await page.goto(home);
    await expect(page.locator(".site-header")).not.toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)"
    );
  });
});

test.describe("Navbar - overlay on mobile (375x667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("the open panel is opaque and uses the normal logo", async ({ page }) => {
    await page.goto(home);
    await page.evaluate(() => {
      const marker = document.createElement("div");
      marker.setAttribute("data-navbar-overlay", "");
      marker.style.cssText = "height:2000px;background:#0b2a5b";
      document.querySelector("main")?.prepend(marker);
    });
    await page.locator("#mobile-menu-toggle").click();
    await expect(page.locator(".nav-container")).toBeVisible();
    await expect(page.locator(".nav-container")).not.toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)"
    );
    await expect(page.locator("body")).toHaveClass(/menu-open/);
    await expect(page.locator(".nav-link").first()).not.toHaveCSS("color", "rgb(255, 255, 255)");
  });
});
