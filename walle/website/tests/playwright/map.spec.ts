import { expect, test } from "@playwright/test";
import { storyRoutes } from "./storyRoutes";

// The map mounts only in astrobook stories: runs against the astrobook webServer
// (playwright.astrobook.config.ts).

// 1x1 transparent PNG served for every OSM tile request.
const ONE_PX_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

function route(url: string): boolean {
  return /(?:^|\.)tile\.openstreetmap\.org\//.test(url);
}

const routes = storyRoutes();
function storyPath(id: string): string {
  const route = routes.find((r) => r.id === id);
  if (!route) throw new Error(`story route not found: ${id}`);
  return route.path;
}

test.describe("Map", () => {
  test("no leaflet request before scroll, markers rendered after scroll, attribution visible", async ({
    page,
  }) => {
    await page.route(
      (url) => route(url.toString()),
      (r) => r.fulfill({ status: 200, contentType: "image/png", body: ONE_PX_PNG })
    );

    // Pushes the map below the viewport plus the 200px IntersectionObserver rootMargin.
    // document.documentElement does not exist yet when an addInitScript body runs, so this
    // waits for DOMContentLoaded; registered first, it runs before Map's own listener.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "body { margin-top: 2000px !important; }";
        document.head.appendChild(style);
      });
    });

    const requestUrls: string[] = [];
    page.on("request", (req) => requestUrls.push(req.url()));

    await page.goto(storyPath("features/map/several-pins"));
    await page.waitForLoadState("networkidle");

    expect(requestUrls.some((u) => /leaflet/i.test(u) || route(u))).toBe(false);
    await expect(page.locator(".leaflet-marker-icon")).toHaveCount(0);

    await page.locator("[data-map-container]").scrollIntoViewIfNeeded();
    await expect(page.locator(".leaflet-marker-icon")).toHaveCount(3);
    expect(requestUrls.some((u) => /leaflet/i.test(u))).toBe(true);
    // leaflet.css sets overflow: hidden on the container: proof the lazy styles applied.
    await expect(page.locator(".leaflet-container")).toHaveCSS("overflow", "hidden");

    await expect(page.locator(".leaflet-control-attribution")).toBeVisible();
  });

  test("markers get an accessible name and their own data-variant", async ({ page }) => {
    await page.route(
      (url) => route(url.toString()),
      (r) => r.fulfill({ status: 200, contentType: "image/png", body: ONE_PX_PNG })
    );

    await page.goto(storyPath("features/map/all-variants"));
    await page.locator("[data-map-container]").scrollIntoViewIfNeeded();
    await expect(page.locator(".leaflet-marker-icon")).toHaveCount(4);

    const icons = page.locator(".leaflet-marker-icon");
    await expect(icons.nth(0)).toHaveAttribute("aria-label", "Rome office");
    await expect(icons.nth(0)).toHaveAttribute("data-variant", "primary");
    await expect(icons.nth(1)).toHaveAttribute("data-variant", "secondary");
    await expect(icons.nth(2)).toHaveAttribute("data-variant", "alternative");
    await expect(icons.nth(3)).toHaveAttribute("data-variant", "site");
  });

  test("fallback list is the visible content without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(storyPath("features/map/single-pin"));

    await expect(page.locator("[data-map-list]")).toBeVisible();
    await expect(page.getByText("Rome office")).toBeVisible();
    await expect(page.locator(".leaflet-marker-icon")).toHaveCount(0);

    await context.close();
  });
});
