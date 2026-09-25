import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

// Tokens are the only styling interface (repo-guide.md): a literal color, radius, shadow or
// px font-size outside tokens.css is a value a theme.json override can never reach. tokens.css
// itself is exempt: it is where every default literal lives, wrapped in `var(--walle-*, ...)`.

const walleRoot = join(__dirname, "../../src/@walle");
const tokensFile = join(walleRoot, "styles/tokens.css");

// Components not yet migrated to token-only styling. This list may
// only shrink: each component migration removes its own entry as part of its verification.
// Never add a file created after this list existed, those are born token-only.
const PENDING_MIGRATION: string[] = [];

function collectFiles(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full, exts));
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
  }
  return out;
}

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^)]*\)/g;
const RADIUS_RE = /border-radius\s*:\s*([^;]+);/g;
// Custom properties named `*-radius` (e.g. --toc-radius) are the public/internal radius
// interface components expose; their value must resolve to a scale token, 0, or a percentage
// (a genuinely circular element, not a themeable scale radius). The scale tokens themselves
// (--radius-sm/md/lg/xl) end in "sm"/"md"/"lg"/"xl", not literally in "radius", so this pattern
// does not match them.
const CUSTOM_RADIUS_PROP_RE = /--[\w-]*radius\s*:\s*([^;]+);/g;
const SHADOW_RE = /box-shadow\s*:\s*([^;]+);/g;
const PX_FONT_SIZE_RE = /font-size\s*:\s*[0-9.]+px/g;
const PERCENT_RE = /^-?[0-9.]+%$/;

/** Line-by-line so a violation can name its exact line, matching this codebase's one-rule-per-line style. */
function findViolations(file: string, source: string): string[] {
  const violations: string[] = [];
  const lines = source.split("\n");
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    if (COLOR_RE.test(line)) violations.push(`${file}:${lineNo} literal color: ${line.trim()}`);
    COLOR_RE.lastIndex = 0;

    let m: RegExpExecArray | null;
    RADIUS_RE.lastIndex = 0;
    while ((m = RADIUS_RE.exec(line)) !== null) {
      const value = m[1].trim();
      if (value !== "0" && !value.startsWith("var("))
        violations.push(`${file}:${lineNo} literal radius: ${line.trim()}`);
    }
    CUSTOM_RADIUS_PROP_RE.lastIndex = 0;
    while ((m = CUSTOM_RADIUS_PROP_RE.exec(line)) !== null) {
      const value = m[1].trim();
      if (value !== "0" && !PERCENT_RE.test(value) && !value.startsWith("var("))
        violations.push(`${file}:${lineNo} literal radius: ${line.trim()}`);
    }
    SHADOW_RE.lastIndex = 0;
    while ((m = SHADOW_RE.exec(line)) !== null) {
      const value = m[1].trim();
      if (value !== "none" && !value.startsWith("var("))
        violations.push(`${file}:${lineNo} literal shadow: ${line.trim()}`);
    }
    if (PX_FONT_SIZE_RE.test(line))
      violations.push(`${file}:${lineNo} px font-size: ${line.trim()}`);
    PX_FONT_SIZE_RE.lastIndex = 0;
  });
  return violations;
}

describe("css-tokens: no literal color/radius/shadow/px font-size outside tokens.css", () => {
  it("fails on a deliberately bad fixture, naming file and line", () => {
    const bad =
      ".a { color: #fff; }\n.b {\n  border-radius: 4px;\n  box-shadow: 0 1px 2px #000;\n  font-size: 14px;\n  --foo-radius: 6px;\n}\n";
    const violations = findViolations("fixture.css", bad);
    expect(violations.length).toBeGreaterThanOrEqual(5);
    expect(violations.some((v) => v.startsWith("fixture.css:1"))).toBe(true);
    expect(violations.some((v) => v.startsWith("fixture.css:3"))).toBe(true);
    expect(violations.some((v) => v.startsWith("fixture.css:4"))).toBe(true);
    expect(violations.some((v) => v.startsWith("fixture.css:5"))).toBe(true);
    expect(violations.some((v) => v.startsWith("fixture.css:6"))).toBe(true);
  });

  it("accepts a fixture that only uses var() and keyword values", () => {
    const good =
      ".a {\n  color: var(--text);\n  border-radius: var(--radius-md);\n  box-shadow: var(--shadow-md);\n  box-shadow: none;\n  border-radius: 0;\n  --foo-radius: var(--radius-md);\n  --foo-radius: 0;\n  --foo-radius: 50%;\n}\n";
    expect(findViolations("fixture.css", good)).toEqual([]);
  });

  it("tokens.css itself is exempt (this is where the literal defaults live)", () => {
    const withLiteral = ":root {\n  --primary: var(--walle-color-primary, #243b6b);\n}\n";
    // tokens.css is only exempted by the caller skipping it below; the matcher itself would
    // still flag it, which is exactly why the loop excludes it by path.
    expect(findViolations("tokens.css", withLiteral).length).toBeGreaterThan(0);
  });

  const files = [
    ...collectFiles(walleRoot, [".css"]),
    ...collectFiles(walleRoot, [".astro"]),
  ].filter((f) => f !== tokensFile);

  for (const file of files) {
    const pending = PENDING_MIGRATION.includes(relative(walleRoot, file));
    it(`${relative(walleRoot, file)} has no literal color/radius/shadow/px font-size`, () => {
      const source = readFileSync(file, "utf-8");
      const violations = findViolations(file, source);
      if (pending) {
        expect(
          violations.length,
          `remove from PENDING_MIGRATION, it is clean now: ${file}`
        ).toBeGreaterThan(0);
      } else {
        expect(violations).toEqual([]);
      }
    });
  }

  for (const entry of PENDING_MIGRATION) {
    it(`PENDING_MIGRATION entry exists: ${entry}`, () => {
      expect(existsSync(join(walleRoot, entry))).toBe(true);
    });
  }
});
