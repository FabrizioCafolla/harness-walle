import { expect, test } from "@playwright/test";
import { siteBase } from "./storyRoutes";

// D11: typography.fonts (Google provider, configured on the demo's own app.json) must resolve
// through Astro's Fonts API to files served from the site's own origin — never a live request
// to the font provider's CDN at runtime.
const home = siteBase || "/";

test.describe("typography.fonts (D11)", () => {
  test("Google font is self-hosted: preload links same-origin, zero requests to a font host", async ({
    page,
  }) => {
    const requestUrls: string[] = [];
    page.on("request", (req) => requestUrls.push(req.url()));

    await page.goto(home);
    const pageOrigin = new URL(page.url()).origin;

    const preloads = page.locator('link[rel="preload"][as="font"]');
    await expect(preloads).not.toHaveCount(0);

    const preloadHrefs = await preloads.evaluateAll((links) =>
      links.map((l) => (l as HTMLLinkElement).href)
    );
    for (const href of preloadHrefs) {
      expect(new URL(href).origin).toBe(pageOrigin);
    }

    const fontHostRequests = requestUrls.filter((url) =>
      /fonts\.gstatic\.com|fonts\.googleapis\.com/.test(url)
    );
    expect(fontHostRequests).toEqual([]);
  });
});
