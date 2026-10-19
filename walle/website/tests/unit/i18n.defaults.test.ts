import { describe, expect, it, vi } from "vitest";

// Isolated in its own file (vi.mock is file-scoped): the config has no `website.language` and
// no `labels`, so every lookup falls back to the English default.
vi.mock("@walle/config", () => ({
  default: { app: { website: {} } },
}));

const { label, locale } = await import("../../src/@walle/utils/i18n");

describe("locale (no website.language configured)", () => {
  it("falls back to en-US", () => {
    expect(locale()).toBe("en-US");
  });
});

describe("label (no labels block configured)", () => {
  it("returns the English default for every group", () => {
    expect(label("skipLink")).toBe("Skip to content");
    expect(label("cart.title")).toBe("Your cart");
    expect(label("price.discounted")).toBe("Discounted price");
    expect(label("notFound.title")).toBe("Not Found.");
    expect(label("toc.heading")).toBe("Contents");
    expect(label("readingTime")).toBe("{duration} read");
  });
});
