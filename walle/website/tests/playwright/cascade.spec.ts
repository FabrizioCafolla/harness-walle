import { expect, test } from "@playwright/test";
import { siteBase } from "./storyRoutes";
import { WALLE_LAYER_DECLARATION } from "../../src/@walle/styles/layers";

// D1: the cascade layer order must be declared before any other stylesheet reaches <head>,
// so walle's own layers always lose to an unlayered `@layer site` rule regardless of load
// order. Task 17.2 adds the behavioral (site-override-wins) assertion once a site-layer
// story exists; this only checks the declaration's position.
const home = siteBase || "/";

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
});
