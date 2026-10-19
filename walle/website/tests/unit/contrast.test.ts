import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contrastRatio } from "../../src/@walle/utils/contrast";

/**
 * WCAG 2.2 AA contrast check for the default walle palette: the text/surface pairings
 * @walle components render with the default theme.
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
// Badge renders --variant-fg on --variant-bg and --status-*-contrast on --status-*: covered by
// the "[data-variant] fg on bg" and "status tokens" blocks below.

describe("default palette meets WCAG 2.2 AA", () => {
  for (const [name, fg, bg, threshold] of pairings) {
    it(`${name} >= ${threshold}:1`, () => {
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(threshold);
    });
  }
});

// Variant model: brand variants plus their inverse rendering and status pairs.
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

// [data-filled] maps text, heading and link tokens to --variant-fg (covered above) and
// --surface-alt, code's background, to --variant-bg-hover.
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

// [data-muted] only redefines --surface-alt, to --surface: covered by "muted text on surface".

// Inverse: --variant-color as text on --surface, as outline/unfilled variants render it.
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

// site must be declared identically to primary, not only resolve to the same colors.
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
