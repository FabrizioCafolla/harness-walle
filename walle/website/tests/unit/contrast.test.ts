import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * WCAG 2.2 AA contrast check for the default walle palette.
 * Pairings listed here are the real text/surface combinations rendered by
 * @walle components with the default theme. If a default color changes,
 * this test keeps the palette honest.
 */

const css = readFileSync(join(__dirname, "../../src/@walle/styles/global.css"), "utf-8");

/** Extract the default hex of a `--token: var(--walle-*, #hex)` or `--token: #hex` declaration. */
function tokenDefault(name: string): string {
  const re = new RegExp(`${name}:\\s*(?:var\\([^,]+,\\s*)?(#[0-9a-fA-F]{3,6})\\)?;`);
  const m = css.match(re);
  if (!m) throw new Error(`token ${name} not found in global.css`);
  return m[1];
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
  alternativeLight: tokenDefault("--alternative-light"),
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
  ["badge-primary text (white on primary-light)", palette.background, palette.primaryLight, NORMAL],
  [
    "badge-alternative text (black on alternative-light)",
    palette.foreground,
    palette.alternativeLight,
    NORMAL,
  ],
  ["badge-gray text (black on gray-light)", palette.foreground, palette.grayLight, NORMAL],
];

// Hardcoded status colors in Badge.astro (white text on colored bg)
const badgeCss = readFileSync(
  join(__dirname, "../../src/@walle/components/elements/Badge.astro"),
  "utf-8"
);
for (const status of ["success", "warning", "danger"]) {
  const m = badgeCss.match(
    new RegExp(`eos-label-${status} \\{\\s*background-color: (#[0-9a-fA-F]{6});`)
  );
  if (m)
    pairings.push([`badge-${status} text (white on ${m[1]})`, palette.background, m[1], NORMAL]);
}

describe("default palette meets WCAG 2.2 AA", () => {
  for (const [name, fg, bg, threshold] of pairings) {
    it(`${name} >= ${threshold}:1`, () => {
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(threshold);
    });
  }
});
