import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { siteBase, storyRoutes } from "./storyRoutes";

// Accessibility gate — axe-core against every Astrobook story preview page
// (per-component fixtures, auto-discovered from the astrobook/ directory so a
// new story is covered with no extra configuration) plus the built demo-site
// pages (layout-level checks: skip link, landmarks, document structure that
// stories never mount).
//
// Run with: just a11y-test
// Fails on any serious or critical violation.

// Demo-site pages (served by the same dev server under the configured base path).
const demoPages = ["/", "/blog", "/blog/example"].map((p) => `${siteBase}${p}`);

/** Guard against silent route drift: astrobook's 404 fallback renders `<pre>Path: …`. */
async function expectNotFallback(page: Page) {
  const fallback = await page.locator("pre", { hasText: /^Path: \// }).count();
  expect(fallback, "page is astrobook's not-found fallback — story route scheme changed").toBe(0);
}

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical"
  );
  const report = blocking
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target).join("\n  ")}`)
    .join("\n");
  expect(report, "serious/critical axe violations").toBe("");
}

// Reduced motion keeps axe deterministic (no mid-animation contrast snapshots
// of scroll-reveal content) and exercises the library's reduced-motion path.
test.describe("axe: astrobook stories", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  for (const route of storyRoutes()) {
    test(route.id, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await expectNotFallback(page);
      await expectNoSeriousViolations(page);
    });
  }
});

test.describe("axe: demo site pages", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  for (const route of demoPages) {
    test(route, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expectNoSeriousViolations(page);
    });
  }
});

// Responsive floor: no page-level horizontal overflow at 320px (WCAG 1.4.10 reflow).
test.describe("320px: no horizontal overflow", () => {
  test.use({ viewport: { width: 320, height: 800 } });

  for (const target of [
    ...storyRoutes().map((r) => ({ name: r.id, path: r.path })),
    ...demoPages.map((p) => ({ name: p, path: p })),
  ]) {
    test(target.name, async ({ page }) => {
      await page.goto(target.path);
      await page.waitForLoadState("networkidle");
      const { overflow, offenders } = await page.evaluate(() => {
        const el = document.scrollingElement!;
        const overflow = el.scrollWidth - el.clientWidth;
        const offenders: string[] = [];
        if (overflow > 1) {
          document.querySelectorAll("*").forEach((node) => {
            const r = node.getBoundingClientRect();
            if (r.right > window.innerWidth + 1 || r.left < -1) {
              offenders.push(
                `${node.tagName.toLowerCase()}.${[...node.classList].join(".")} [${Math.round(r.left)}..${Math.round(r.right)}]`
              );
            }
          });
        }
        return { overflow, offenders };
      });
      expect(
        overflow,
        `page scrolls horizontally by ${overflow}px\n${offenders.slice(0, 10).join("\n")}`
      ).toBeLessThanOrEqual(1);
    });
  }
});
