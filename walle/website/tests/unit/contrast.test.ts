import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * WCAG 2.2 AA contrast check for the default walle palette.
 * Pairings listed here are the real text/surface combinations rendered by
 * @walle components with the default theme. If a default color changes,
 * this test keeps the palette honest.
 */

const css = readFileSync(join(__dirname, "../../src/@walle/styles/tokens.css"), "utf-8");

/** Raw declaration value of a top-level (`:root`) custom property, before resolving `var()`. */
function findDeclarationRaw(name: string): string {
  const re = new RegExp(`${name}:\\s*([^;]+);`);
  const m = css.match(re);
  if (!m) throw new Error(`token ${name} not found in tokens.css`);
  return m[1].trim();
}

/**
 * Resolves a declaration value down to a literal hex: follows `var(--walle-*, fallback)`
 * bridges (never set by the default theme, so the fallback is the real default) and plain
 * alias references like `var(--primary)` recursively.
 */
function resolveValue(raw: string): string {
  const hexMatch = raw.match(/^(#[0-9a-fA-F]{3,8})$/);
  if (hexMatch) return hexMatch[1];
  const varMatch = raw.match(/^var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*(.+))?\)$/);
  if (varMatch) {
    const [, refName, fallback] = varMatch;
    if (refName.startsWith("--walle-")) {
      if (!fallback) throw new Error(`no fallback for bridge var ${refName}`);
      return resolveValue(fallback.trim());
    }
    return resolveValue(findDeclarationRaw(refName));
  }
  throw new Error(`unresolvable token value: ${raw}`);
}

/** Extract the resolved default hex of a top-level custom property. */
function tokenDefault(name: string): string {
  return resolveValue(findDeclarationRaw(name));
}

function escapeSelector(selector: string): string {
  return selector.replace(/[[\]()."]/g, "\\$&");
}

/** Raw declaration value of a custom property scoped to one attribute-selector block. */
function selectorDeclarationRaw(selector: string, prop: string): string {
  const selRe = new RegExp(`${escapeSelector(selector)}\\s*\\{([^}]*)\\}`);
  const blockMatch = css.match(selRe);
  if (!blockMatch) throw new Error(`selector ${selector} not found in tokens.css`);
  const propMatch = blockMatch[1].match(new RegExp(`${prop}:\\s*([^;]+);`));
  if (!propMatch) throw new Error(`${prop} not found in ${selector}`);
  return propMatch[1].trim();
}

/** Resolved default hex of a `--variant-*` property under `[data-variant="<variant>"]`. */
function variantToken(variant: string, prop: string): string {
  return resolveValue(selectorDeclarationRaw(`[data-variant="${variant}"]`, prop));
}

function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const palette = {
  gray: tokenDefault("--gray"),
  primary: tokenDefault("--primary"),
  primaryLight: tokenDefault("--primary-light"),
  secondary: tokenDefault("--secondary"),
  secondaryLight: tokenDefault("--secondary-light"),
  background: tokenDefault("--white"),
  foreground: tokenDefault("--black"),
  grayLight: tokenDefault("--gray-light"),
  grayDark: tokenDefault("--gray-dark"),
  grayDarker: tokenDefault("--gray-darker"),
};

// AA thresholds: 4.5:1 normal text, 3:1 large text (>=24px or >=18.66px bold)
const NORMAL = 4.5;

// [description, fg, bg, threshold]
const pairings: [string, string, string, number][] = [
  ["text on surface", palette.foreground, palette.background, NORMAL],
  ["muted text on surface (p on body)", palette.grayDark, palette.background, NORMAL],
  ["muted text on surface-alt (p in gray Section)", palette.grayDark, palette.grayLight, NORMAL],
  ["muted text on gray (Footer)", palette.grayDark, palette.gray, NORMAL],
  ["body text on surface", palette.grayDarker, palette.background, NORMAL],
  ["link on surface", palette.primary, palette.background, NORMAL],
  ["link on surface-alt", palette.primary, palette.grayLight, NORMAL],
  ["button-primary text (white on primary)", palette.background, palette.primary, NORMAL],
  [
    "button-primary gradient end (white on primary-light)",
    palette.background,
    palette.primaryLight,
    NORMAL,
  ],
  ["button-secondary text (white on secondary)", palette.background, palette.secondary, NORMAL],
  [
    "button-secondary gradient end (white on secondary-light)",
    palette.background,
    palette.secondaryLight,
    NORMAL,
  ],
];
// Badge's filled state now maps to --variant-fg on --variant-bg (D4), already covered by
// the "[data-variant] fg on bg" describe block below — no separate literal pairing needed.
// Its status coloring maps to --status-*-contrast on --status-* (D4), covered by the
// "status tokens" describe block below.

describe("default palette meets WCAG 2.2 AA", () => {
  for (const [name, fg, bg, threshold] of pairings) {
    it(`${name} >= ${threshold}:1`, () => {
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(threshold);
    });
  }
});

// D4 variant model — brand variants plus their inverse rendering and status pairs.
const VARIANTS = ["primary", "secondary", "alternative"] as const;
const VARIANT_PROPS = [
  "--variant-color",
  "--variant-color-hover",
  "--variant-bg",
  "--variant-bg-hover",
  "--variant-fg",
];
const STATUSES = ["success", "warning", "danger"] as const;

describe("[data-variant] fg on bg meets WCAG 2.2 AA", () => {
  for (const variant of VARIANTS) {
    it(`${variant}: --variant-fg on --variant-bg >= ${NORMAL}:1`, () => {
      const fg = variantToken(variant, "--variant-fg");
      const bg = variantToken(variant, "--variant-bg");
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(NORMAL);
    });
  }
});

// SectionWrapper's [data-filled] redefines --text/--text-muted/--heading/--link/
// --link-hover to --variant-fg, always read against the wrapper's own --variant-bg: the
// exact pairing the block above already covers, so no separate case is needed for those.
// --surface-alt is the one token it redefines to something else (--variant-bg-hover, for
// code's background), which needs its own pairing below.
describe("[data-filled] code background (--variant-fg on --variant-bg-hover) meets WCAG 2.2 AA", () => {
  for (const variant of VARIANTS) {
    it(`${variant}: --variant-fg on --variant-bg-hover >= ${NORMAL}:1`, () => {
      const fg = variantToken(variant, "--variant-fg");
      const bg = variantToken(variant, "--variant-bg-hover");
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(NORMAL);
    });
  }
});

// SectionWrapper's [data-muted] only redefines --surface-alt, to --surface (white):
// code's background moves off the section's own gray, onto the same white/gray-dark pairing
// "muted text on surface (p on body)" above already covers. --text/--text-muted/--heading/
// link colors are untouched: --surface-alt (gray-light) is close enough to --surface that
// "muted text on surface-alt (p in gray Section)" above already stands in for them too.

// Inverse: a filled variant's own --variant-color rendered as text on a neutral surface
// (the shape an outline/unfilled variant's text takes, e.g. Button's old `white` variant:
// --surface background, --primary text).
describe("[data-variant] inverse (--variant-color on --surface) meets WCAG 2.2 AA", () => {
  const surface = tokenDefault("--surface");
  for (const variant of VARIANTS) {
    it(`${variant}: --variant-color on --surface >= ${NORMAL}:1`, () => {
      const color = variantToken(variant, "--variant-color");
      const ratio = contrastRatio(color, surface);
      expect(ratio, `${color} on ${surface} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        NORMAL
      );
    });
  }
});

// site is defined identical to primary by construction (D4); enforce it stays that way,
// not just that the two happen to resolve to the same color today.
describe('[data-variant="site"] matches [data-variant="primary"] line for line', () => {
  for (const prop of VARIANT_PROPS) {
    it(`${prop} is identical`, () => {
      const primaryRaw = selectorDeclarationRaw('[data-variant="primary"]', prop);
      const siteRaw = selectorDeclarationRaw('[data-variant="site"]', prop);
      expect(siteRaw).toBe(primaryRaw);
    });
  }
});

describe("status tokens meet WCAG 2.2 AA", () => {
  for (const status of STATUSES) {
    it(`--status-${status}-contrast on --status-${status} >= ${NORMAL}:1`, () => {
      const bg = tokenDefault(`--status-${status}`);
      const fg = tokenDefault(`--status-${status}-contrast`);
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(NORMAL);
    });
  }
});
