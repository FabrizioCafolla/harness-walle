import { expect, test } from "@playwright/test";
import { siteBase } from "./storyRoutes";

// Link's external-host detection reads `Astro.site`, which astro/container's
// experimental_AstroContainer never wires up (tests/unit/components/Link.test.ts documents
// this), so that half of the contract can only be checked against a real render. The showcase
// page already exercises both cases; this is that verification.
const showcase = `${siteBase || ""}/showcase`;

test.describe("Link external-host detection (build-level)", () => {
  test("external link gets rel=noopener noreferrer and the external icon", async ({ page }) => {
    await page.goto(showcase);
    const link = page.locator('a[href="https://astro.build"]');
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link.locator(".link-external-icon")).toBeVisible();
  });

  test("internal link on the site's own host has no rel and no external icon", async ({ page }) => {
    await page.goto(showcase);
    const link = page.getByRole("link", { name: "Internal link" });
    await expect(link).not.toHaveAttribute("rel", /.+/);
    await expect(link.locator(".link-external-icon")).toHaveCount(0);
  });
});

// The real footer.json only ships 2 nav links; a consumer configuring 8 would rely on
// `.footer-nav__list`'s wrap behavior to avoid pushing the page wider than the viewport.
test.describe("Footer nav list wraps at 320px", () => {
  test.use({ viewport: { width: 320, height: 800 } });

  test("8 footer links wrap instead of overflowing", async ({ page }) => {
    // No trailing slash, app.json sets trailingSlash "never" and `${siteBase}/` 404s.
    await page.goto(siteBase || "/");
    await page.evaluate(() => {
      const list = document.querySelector(".footer-nav__list");
      if (!list) throw new Error("footer-nav__list not found");
      for (let i = 0; i < 8; i++) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = `Link ${i + 1}`;
        li.appendChild(a);
        list.appendChild(li);
      }
    });
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement!;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
