import { describe, expect, it } from "vitest";
import { pickOgTemplatePath } from "../../src/@walle/og/route";

describe("pickOgTemplatePath", () => {
  it("returns undefined when no templates are configured", () => {
    expect(pickOgTemplatePath(undefined, undefined)).toBeUndefined();
    expect(pickOgTemplatePath("posts", undefined)).toBeUndefined();
  });

  it("falls back to templates.default when the collection has no override", () => {
    const templates = { default: "./src/og/site.ts" };
    expect(pickOgTemplatePath("posts", templates)).toBe("./src/og/site.ts");
    expect(pickOgTemplatePath(undefined, templates)).toBe("./src/og/site.ts");
  });

  it("prefers templates[collection] over templates.default", () => {
    const templates = { default: "./src/og/site.ts", posts: "./src/og/post.ts" };
    expect(pickOgTemplatePath("posts", templates)).toBe("./src/og/post.ts");
    expect(pickOgTemplatePath("products", templates)).toBe("./src/og/site.ts");
  });

  it("returns undefined (walle's own default applies) when neither key is configured", () => {
    expect(pickOgTemplatePath("posts", {})).toBeUndefined();
  });
});
