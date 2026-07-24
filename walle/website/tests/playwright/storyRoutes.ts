import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Astrobook story-route discovery, mirroring @astrobook/core's virtual routes:
// astrobook/<dir>/<Name>.stories.ts with `export const StoryName` becomes
//   /astrobook/stories/<dir>/<kebab(Name)>/<kebab(StoryName)>   (bare preview)
// The preview page renders the story in isolation — the right fixture for
// axe and visual snapshots. Discovery is filesystem-based so a new story is
// covered with no extra configuration.

const websiteRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const astrobookDir = join(websiteRoot, "astrobook");

// Routes mount under Astro's `base` (src/configs/app.json → astro.basePath).
// Unprefixed paths happen to answer 200 to curl's `Accept: */*` in dev, but a
// browser's `Accept: text/html` gets a 404 — always use the base-prefixed form.
export const siteBase: string = (() => {
  const app = JSON.parse(readFileSync(join(websiteRoot, "src/configs/app.json"), "utf-8"));
  const base = app?.astro?.basePath ?? "";
  return base === "/" ? "" : base.replace(/\/$/, "");
})();

/** Same shape as astrobook's internal kebab-case (es-toolkit style). */
export function kebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export interface StoryRoute {
  /** e.g. "features/carousel/three-per-view" */
  id: string;
  /** e.g. "/astrobook/stories/features/carousel/three-per-view" */
  path: string;
}

export function storyRoutes(): StoryRoute[] {
  const routes: StoryRoute[] = [];
  for (const group of readdirSync(astrobookDir, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    for (const file of readdirSync(join(astrobookDir, group.name))) {
      const m = file.match(/^(.+)\.stories\.ts$/);
      if (!m) continue;
      const moduleId = `${group.name}/${kebabCase(m[1])}`;
      const source = readFileSync(join(astrobookDir, group.name, file), "utf-8");
      for (const exp of source.matchAll(/^export const (\w+)\s*=/gm)) {
        const id = `${moduleId}/${kebabCase(exp[1])}`;
        routes.push({ id, path: `${siteBase}/astrobook/stories/${id}` });
      }
    }
  }
  return routes.sort((a, b) => a.id.localeCompare(b.id));
}
