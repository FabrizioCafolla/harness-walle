import { existsSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";

/**
 * Resolves a `./`-prefixed site override to an absolute path of an existing file (not a
 * directory) under the project's `src/`; otherwise throws naming `label` and the value. Used by
 * `components.*`, `commerce.pages.*`, `pwa.offline` and `seo.ogImage.templates.*`. No
 * astro/config imports: `og/route.ts` imports it at request time.
 */
export function resolveSitePath(value: string, root: string, label: string): string {
  const abs = resolve(root, value);
  const srcRoot = resolve(root, "src") + sep;
  if (!abs.startsWith(srcRoot)) {
    throw new Error(
      `[walle] ${label} points to "${value}", which is outside src/. ` +
        `Overrides must live under the project's src/ directory.`
    );
  }
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    throw new Error(`[walle] ${label} points to "${value}", but that file does not exist.`);
  }
  return abs;
}
