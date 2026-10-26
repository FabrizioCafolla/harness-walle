import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("Navbar keyboard focus", () => {
  const navbar = read("src/@walle/components/features/Navbar/Navbar.astro");

  it("never removes the outline of a navbar link", () => {
    expect(navbar).not.toMatch(/outline:\s*none/);
  });

  it("draws a focus ring on every navbar link kind with the focus token", () => {
    for (const selector of [".brand-link", ".nav-link", ".dropdown-link"]) {
      expect(navbar).toContain(`${selector}:focus-visible`);
    }
    expect(navbar).toMatch(/outline:\s*3px solid var\(--focus-ring\)/);
  });
});

describe("Organization logo", () => {
  it("comes from the site image, not from the page's own image", () => {
    const layout = read("src/@walle/layouts/AbstractLayout.astro");
    const siteInfo = layout.slice(
      layout.indexOf("const siteInfo"),
      layout.indexOf("const structuredData")
    );
    expect(siteInfo).toContain("config.app.website.image");
    expect(siteInfo).not.toContain("headerImage");
  });
});

describe("Language props reach the document", () => {
  it("forwards headerLanguage and headerTranslations from every layout built on BaseLayout", () => {
    for (const name of ["BlogPostLayout", "BlogPostsLayout", "DetailLayout"]) {
      const layout = read(`src/@walle/layouts/${name}.astro`);
      expect(layout, name).toContain("headerLanguage={headerLanguage}");
      expect(layout, name).toContain("headerTranslations={headerTranslations}");
    }
  });
});

describe("Twitter card tags", () => {
  it("use the name attribute, as the Twitter Cards markup does", () => {
    const head = read("src/@walle/components/features/Head.astro");
    expect(head).toContain('<meta name="twitter:card"');
    expect(head).not.toContain('property="twitter:');
  });
});

describe("Sticky navbar", () => {
  it("lives in a body that grows with the page, so it stays stuck to the bottom", () => {
    const base = read("src/@walle/styles/base.css");
    const body = base.slice(base.indexOf("  body {"), base.indexOf("  main {"));
    expect(body).not.toMatch(/\bheight:\s*100%/);
    expect(body).toMatch(/min-height:\s*100vh/);
  });

  it("declares the prefixed backdrop-filter before the standard one (the minifier keeps the standard one only then)", () => {
    for (const file of [
      "src/@walle/components/features/Navbar/Navbar.astro",
      "src/@walle/components/features/Blog/BlogTableOfContents.astro",
    ]) {
      const css = read(file);
      const lines = css.split("\n").map((l) => l.trim());
      lines.forEach((line, i) => {
        if (line.startsWith("backdrop-filter:"))
          expect(lines[i - 1]).toMatch(/^-webkit-backdrop-filter:/);
      });
    }
  });
});
