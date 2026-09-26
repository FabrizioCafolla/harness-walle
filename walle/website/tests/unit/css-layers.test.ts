import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Every rule under @walle must sit inside a `walle.*` (or `site`) layer, so a consumer's
// unlayered `@layer site` rule always wins regardless of load order. The one exception is a
// `<style is:global>` block whose only content is an `@import "..." layer(walle.components);`
// statement, for leaflet's own CSS: Astro's scoped-style compiler
// would otherwise cid-scope selectors that leaflet creates at runtime and can never match.

const walleRoot = join(__dirname, "../../src/@walle");

function collectFiles(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full, exts));
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
  }
  return out;
}

function lineAt(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

/**
 * Scans top-level CSS content for anything not consumed by an `@import` statement or a
 * balanced `@layer ...{ }` block (or a bare `@layer a, b;` order declaration). Returns the
 * index of the first offending character, or null if the whole text is accounted for.
 */
function findUnlayered(css: string): number | null {
  let i = 0;
  const n = css.length;
  while (i < n) {
    while (i < n && /\s/.test(css[i])) i++;
    if (i >= n) break;
    if (css.startsWith("/*", i)) {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (css.startsWith("@import", i)) {
      const end = css.indexOf(";", i);
      i = end === -1 ? n : end + 1;
      continue;
    }
    if (css.startsWith("@layer", i)) {
      const semi = css.indexOf(";", i);
      const brace = css.indexOf("{", i);
      if (brace !== -1 && (semi === -1 || brace < semi)) {
        let depth = 0;
        let j = brace;
        do {
          if (css[j] === "{") depth++;
          else if (css[j] === "}") depth--;
          j++;
        } while (depth > 0 && j < n);
        i = j;
      } else {
        i = semi === -1 ? n : semi + 1;
      }
      continue;
    }
    return i;
  }
  return null;
}

/** Extracts each `<style ...>...</style>` block's inner content and its offset in the file. */
function styleBlocks(source: string): { content: string; offset: number }[] {
  const blocks: { content: string; offset: number }[] = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    blocks.push({ content: m[1], offset: m.index + m[0].indexOf(m[1]) });
  }
  return blocks;
}

/** The leaflet exception: a block whose only content is one or more bare `@import` statements. */
function isImportOnly(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  return trimmed
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .every((s) => s.startsWith("@import"));
}

/** `fullSource`/`offset` let a violation inside a `<style>` block report its real file line. */
function check(file: string, content: string, fullSource = content, offset = 0): string[] {
  if (isImportOnly(content)) return [];
  const violation = findUnlayered(content);
  if (violation === null) return [];
  const line = lineAt(fullSource, offset + violation);
  return [`${file}:${line}`];
}

describe("css-layers: every walle rule sits inside a walle.* layer", () => {
  it("fails on a deliberately unlayered fixture, naming file and line", () => {
    const bad = "@layer walle.base { .ok {} }\n.oops {\n  color: red;\n}\n";
    const violations = check("fixture.css", bad);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("fixture.css:2");
  });

  it("accepts a fully layered fixture", () => {
    const good =
      '@layer walle.base, site;\n@import "./tokens.css";\n@layer walle.base {\n  .ok {}\n}\n';
    expect(check("fixture.css", good)).toEqual([]);
  });

  it("accepts the leaflet-style import-only exception", () => {
    const content = '\n  @import "leaflet/dist/leaflet.css" layer(walle.components);\n';
    expect(isImportOnly(content)).toBe(true);
    expect(check("Map.astro", content)).toEqual([]);
  });

  for (const file of collectFiles(walleRoot, [".css"])) {
    it(`${file.replace(walleRoot, "@walle")} has no unlayered rule`, () => {
      const source = readFileSync(file, "utf-8");
      expect(check(file, source)).toEqual([]);
    });
  }

  for (const file of collectFiles(walleRoot, [".astro"])) {
    const source = readFileSync(file, "utf-8");
    const blocks = styleBlocks(source);
    if (blocks.length === 0) continue;
    it(`${file.replace(walleRoot, "@walle")} <style> block(s) have no unlayered rule`, () => {
      const violations = blocks.flatMap((b) => check(file, b.content, source, b.offset));
      expect(violations).toEqual([]);
    });
  }
});

// The layer order is declared in exactly one place, the inline statement Head.astro
// renders as the first <head> child (astrobook.astro.head mirrors it for story pages), with
// base.css's own copy as the fallback for any page that never renders Head.astro. A component
// re-declaring the order itself only works by luck of module load order (whichever file's
// bare `@layer a, b, c;` statement is first on the page wins, and Vite's dev-mode injection
// order is not guaranteed), so it must never come back once removed.
const LAYER_ORDER_RE = /@layer\s+[\w.]+(?:\s*,\s*[\w.]+)+\s*;/;

describe("css-layers: no component re-declares the layer order", () => {
  it("fails on a deliberately bad fixture", () => {
    const bad = "<style>\n  @layer walle.base, walle.components;\n</style>\n";
    const blocks = styleBlocks(bad);
    expect(blocks.some((b) => LAYER_ORDER_RE.test(b.content))).toBe(true);
  });

  it("accepts a fixture with only a layer block, no order statement", () => {
    const good = "<style>\n  @layer walle.components {\n    .a {}\n  }\n</style>\n";
    const blocks = styleBlocks(good);
    expect(blocks.some((b) => LAYER_ORDER_RE.test(b.content))).toBe(false);
  });

  for (const file of collectFiles(join(walleRoot, "components"), [".astro"])) {
    const source = readFileSync(file, "utf-8");
    const blocks = styleBlocks(source);
    if (blocks.length === 0) continue;
    it(`${file.replace(walleRoot, "@walle")} does not re-declare the layer order`, () => {
      expect(blocks.some((b) => LAYER_ORDER_RE.test(b.content))).toBe(false);
    });
  }
});
