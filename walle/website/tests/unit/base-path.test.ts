import { describe, expect, it } from "vitest";
import { stripBase, withBase } from "../../src/@walle/utils/base-path";

describe("stripBase", () => {
  it("returns the pathname unchanged when base is absent or root", () => {
    expect(stripBase("/rss.xml", undefined)).toBe("/rss.xml");
    expect(stripBase("/rss.xml", "/")).toBe("/rss.xml");
  });

  it("strips a matching base at a path-segment boundary", () => {
    expect(stripBase("/harness-walle/rss.xml", "/harness-walle")).toBe("/rss.xml");
    expect(stripBase("/harness-walle", "/harness-walle")).toBe("/");
  });

  it("does not strip a base that only shares a text prefix, not a path segment", () => {
    expect(stripBase("/harness-walle-docs/x", "/harness-walle")).toBe("/harness-walle-docs/x");
  });
});

describe("withBase", () => {
  it("returns the destination unchanged when base is absent or root", () => {
    expect(withBase("/rss.xml")).toBe("/rss.xml");
    expect(withBase("/rss.xml", "/")).toBe("/rss.xml");
  });

  it("prefixes an internal destination with the base", () => {
    expect(withBase("/rss.xml", "/harness-walle")).toBe("/harness-walle/rss.xml");
  });

  it("is idempotent: a destination already carrying the base is left alone", () => {
    expect(withBase("/harness-walle/rss.xml", "/harness-walle")).toBe("/harness-walle/rss.xml");
  });

  it("leaves external and protocol-relative destinations untouched", () => {
    expect(withBase("https://example.com/x", "/harness-walle")).toBe("https://example.com/x");
    expect(withBase("//example.com/x", "/harness-walle")).toBe("//example.com/x");
  });
});
