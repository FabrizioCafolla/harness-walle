import { describe, expect, it } from "vitest";
import { groupPages, resolveLink, rewriteLinks, sectionOf, titleOf } from "../../src/pages/wiki/_wiki";

describe("wiki sections", () => {
  it("takes the section from the first directory of the id", () => {
    expect(sectionOf("architecture/pwa")).toBe("architecture");
    expect(sectionOf("get-started/first-site")).toBe("get-started");
    expect(sectionOf("readme")).toBeNull();
    expect(sectionOf("unknown/page")).toBeNull();
  });

  it("prefers frontmatter title, then the first H1, then the id", () => {
    expect(titleOf({ id: "a", data: { title: "Front" }, body: "# Heading" })).toBe("Front");
    expect(titleOf({ id: "a", body: "intro\n# Heading\n" })).toBe("Heading");
    expect(titleOf({ id: "develop/cli" })).toBe("develop/cli");
  });

  it("groups Overview first, then Get Started, Develop, Architecture, AI, ordered by `order`", () => {
    const groups = groupPages([
      { id: "ai/skills", data: { title: "Skills", order: 2 } },
      { id: "architecture/style", data: { title: "Style", order: 3 } },
      { id: "architecture/components", data: { title: "Components", order: 2 } },
      { id: "get-started/index", data: { title: "Get started", order: 1 } },
      { id: "readme", data: { title: "Walle" } },
      { id: "develop/cli", data: { title: "CLI" } },
    ]);
    expect(groups.map((g) => g.id)).toEqual([
      "overview",
      "get-started",
      "develop",
      "architecture",
      "ai",
    ]);
    expect(groups[3].pages.map((p) => p.id)).toEqual([
      "architecture/components",
      "architecture/style",
    ]);
  });
});

describe("wiki links", () => {
  it("resolves sibling, parent and nested links against the page directory", () => {
    expect(resolveLink("architecture/pwa", "style.md")).toEqual({
      kind: "wiki",
      id: "architecture/style",
      hash: "",
    });
    expect(resolveLink("architecture/pwa", "../develop/cli.md#commands")).toEqual({
      kind: "wiki",
      id: "develop/cli",
      hash: "#commands",
    });
    expect(resolveLink("readme", "get-started/index.md")).toEqual({
      kind: "wiki",
      id: "get-started/index",
      hash: "",
    });
  });

  it("sends links that leave the wiki folder to the repo file", () => {
    expect(resolveLink("architecture/pwa", "../../CHANGELOG.md")).toEqual({
      kind: "repo",
      path: "CHANGELOG.md",
      hash: "",
    });
    expect(resolveLink("readme", "../AGENTS.md#rules")).toEqual({
      kind: "repo",
      path: "AGENTS.md",
      hash: "#rules",
    });
  });

  it("ignores absolute, external and non-markdown links", () => {
    expect(resolveLink("readme", "https://example.com/a.md")).toBeNull();
    expect(resolveLink("readme", "/wiki/readme")).toBeNull();
    expect(resolveLink("readme", "image.png")).toBeNull();
  });

  it("rewrites only links whose target exists", () => {
    const ids = new Set(["architecture/style"]);
    const html = '<a href="style.md">s</a><a href="missing.md">m</a><a href="../../CHANGELOG.md">c</a>';
    expect(rewriteLinks(html, "architecture/pwa", ids, "/base")).toBe(
      '<a href="/base/wiki/architecture/style">s</a><a href="missing.md">m</a>' +
        '<a href="https://github.com/FabrizioCafolla/harness-walle/blob/main/CHANGELOG.md">c</a>'
    );
  });
});
