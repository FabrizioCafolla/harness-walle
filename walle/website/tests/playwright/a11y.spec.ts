import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Accessibility gate — axe-core against every Astrobook story page (per-component
// fixtures, auto-discovered from the astrobook/ directory so a new story is covered
// with no extra configuration) plus the built demo-site pages (layout-level checks:
// skip link, landmarks, document structure that stories never mount).
//
// Run with: yarn playwright test --config playwright.astrobook.config.ts a11y.spec.ts
// Fails on any serious or critical violation.

const astrobookDir = join(dirname(fileURLToPath(import.meta.url)), "../../astrobook");

/** Derive story routes: astrobook/<group>/<Name>.stories.ts -> /astrobook/<group>/<Name> */
function storyRoutes(): string[] {
  const routes: string[] = [];
  for (const group of readdirSync(astrobookDir, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    for (const f of readdirSync(join(astrobookDir, group.name))) {
      const m = f.match(/^(.+)\.stories\.ts$/);
      if (m) routes.push(`/astrobook/${group.name}/${m[1]}`);
    }
  }
  return routes.sort();
}

// Demo-site pages (served by the same dev server under the configured base path).
const demoPages = ["/harness-walle/", "/harness-walle/blog", "/harness-walle/blog/example"];

async function expectNoSeriousViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical"
  );
  const report = blocking
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target).join("\n  ")}`)
    .join("\n");
  expect(blocking, report).toEqual([]);
}

test.describe("axe: astrobook stories", () => {
  for (const route of storyRoutes()) {
    test(route, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expectNoSeriousViolations(page);
    });
  }
});

test.describe("axe: demo site pages", () => {
  for (const route of demoPages) {
    test(route, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expectNoSeriousViolations(page);
    });
  }
});
