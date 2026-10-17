import { expect, test } from "@playwright/test";
import { siteBase } from "./storyRoutes";

const showcase = `${siteBase || ""}/blog`;

// The `--filters-*` properties default to the original look, and a site can restyle the panel,
// the search field, the dropdowns and the reset with them. The behavior never depends on them.
test.describe("CollectionFilters - public properties", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("defaults: no panel, bare search line, bordered reset", async ({ page }) => {
    await page.goto(showcase);
    const filters = page.locator(".filters").first();
    await expect(filters).toBeVisible();
    await expect(filters).toHaveCSS("box-shadow", "none");
    await expect(filters).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(page.locator(".filters__input").first()).toHaveCSS("border-top-style", "none");
    await expect(page.locator(".filters__clear").first()).toHaveCSS("border-top-style", "solid");
  });

  test("a site can turn it into a card with a pill search and a link reset", async ({ page }) => {
    await page.goto(showcase);
    await page.addStyleTag({
      content: `@layer site { .filters {
        --filters-bg: rgb(255, 255, 255);
        --filters-radius: 22px;
        --filters-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        --filters-search-border: 1px solid rgb(122, 147, 184);
        --filters-search-radius: 999px;
        --filters-control-radius: 999px;
        --filters-clear-border: none;
        --filters-clear-decoration: underline;
      } }`,
    });
    const filters = page.locator(".filters").first();
    await expect(filters).toHaveCSS("border-top-left-radius", "22px");
    await expect(filters).not.toHaveCSS("box-shadow", "none");
    await expect(page.locator(".filters__input").first()).toHaveCSS(
      "border-top-left-radius",
      "999px"
    );
    await expect(page.locator(".filters__dropdown-btn").first()).toHaveCSS(
      "border-top-left-radius",
      "999px"
    );
    await expect(page.locator(".filters__clear").first()).toHaveCSS("border-top-style", "none");
    await expect(page.locator(".filters__clear").first()).toHaveCSS(
      "text-decoration-line",
      "underline"
    );
  });

  test("search and reset still filter", async ({ page }) => {
    await page.goto(showcase);
    const status = page.locator(".filters__status").first();
    const before = await status.textContent();
    await page.locator("[data-filter-search]").first().fill("zzzzzz-no-match");
    await expect(status).not.toHaveText(before ?? "");
    await page.locator(".filters__clear").first().click();
    await expect(status).toHaveText(before ?? "");
  });
});
