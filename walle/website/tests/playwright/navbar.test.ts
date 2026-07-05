import { expect, test } from "@playwright/test";

test.describe("Navbar - Desktop (1280x800)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("navbar is visible", async ({ page }) => {
    await page.goto("/");
    const navbar = page.locator("nav.main-nav");
    await expect(navbar).toBeVisible();
  });

  test("nav links are visible (no hamburger)", async ({ page }) => {
    await page.goto("/");
    const navLinks = page.locator(".nav-links");
    await expect(navLinks).toBeVisible();
  });

  test("dropdown appears on hover and does not overflow", async ({ page }) => {
    await page.goto("/");
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
    await page.goto("/");
    const blogTrigger = page.locator(".dropdown-trigger").first();
    await blogTrigger.hover();

    const dropdown = page.locator(".dropdown-menu").first();
    await expect(dropdown).toBeVisible();

    const itemCount = await dropdown.locator(".dropdown-link").count();
    expect(itemCount).toBeGreaterThan(0);
  });
});

test.describe("Navbar - Mobile (375x667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("hamburger is visible", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.locator("#mobile-menu-toggle");
    await expect(hamburger).toBeVisible();
  });

  test("nav container hidden initially", async ({ page }) => {
    await page.goto("/");
    const navContainer = page.locator(".nav-container");
    await expect(navContainer).not.toBeVisible();
  });

  test("nav container visible after hamburger click", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.locator("#mobile-menu-toggle");
    await hamburger.click();

    const navContainer = page.locator(".nav-container");
    await expect(navContainer).toBeVisible();
  });

  test("nav links do not overflow viewport", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.locator("#mobile-menu-toggle");
    await hamburger.click();

    const navLinks = page.locator(".nav-links");
    const box = await navLinks.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });

  test("dropdown visible after click", async ({ page }) => {
    await page.goto("/");
    const hamburger = page.locator("#mobile-menu-toggle");
    await hamburger.click();

    const blogTrigger = page.locator(".dropdown-trigger").first();
    await blogTrigger.click();

    const dropdown = page.locator(".dropdown-menu").first();
    await expect(dropdown).toBeVisible();
  });

  test("mobile dropdown does not overflow", async ({ page }) => {
    await page.goto("/");
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
    await page.goto("/");
    const hamburger = page.locator("#mobile-menu-toggle");
    await expect(hamburger).toBeVisible();
  });
});
