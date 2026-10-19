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

describe("Twitter card tags", () => {
  it("use the name attribute, as the Twitter Cards markup does", () => {
    const head = read("src/@walle/components/features/Head.astro");
    expect(head).toContain('<meta name="twitter:card"');
    expect(head).not.toContain('property="twitter:');
  });
});
