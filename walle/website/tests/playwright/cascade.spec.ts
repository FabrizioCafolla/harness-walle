import { expect, test } from "@playwright/test";
import { siteBase, storyRoutes } from "./storyRoutes";
import { WALLE_LAYER_DECLARATION } from "../../src/@walle/styles/layers";

// D1: the cascade layer order must be declared before any other stylesheet reaches <head>,
// so walle's own layers always lose to a `@layer site` rule (and any unlayered rule) that
// arrives later in the document, regardless of actual load order.
const home = siteBase || "/";

const routes = storyRoutes();
function storyPath(id: string): string {
  const route = routes.find((r) => r.id === id);
  if (!route) throw new Error(`story route not found: ${id}`);
  return route.path;
}

test.describe("cascade layers", () => {
  test("declaration first", async ({ page }) => {
    await page.goto(home);
    const first = await page.evaluate(() => {
      const el = document.head.firstElementChild;
      return el ? { tagName: el.tagName, text: el.textContent } : null;
    });
    expect(first?.tagName).toBe("STYLE");
    expect(first?.text).toBe(WALLE_LAYER_DECLARATION);
  });

  test("a @layer site rule overrides walle's own layered rule on a real component", async ({
    page,
  }) => {
    await page.goto(storyPath("contract/override/default"));
    const bg = await page
      .locator(".override-site-target")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(102, 0, 102)");
  });

  test("an unlayered rule overrides walle's own layered rule on a real component", async ({
    page,
  }) => {
    await page.goto(storyPath("contract/override/default"));
    const bg = await page
      .locator(".override-unlayered-target")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(0, 102, 102)");
  });
});
