import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";

import { appSchema, footerSchema, navbarSchema, themeSchema } from "../../src/@walle/config/schema";

const readConfig = (name: string) =>
  JSON.parse(readFileSync(join(__dirname, "../../src/configs", name), "utf-8"));

describe("config schemas parse the demo configs", () => {
  it("parses app.json", () => {
    expect(() => appSchema.parse(readConfig("app.json"))).not.toThrow();
  });

  it("parses navbar.json", () => {
    expect(() => navbarSchema.parse(readConfig("navbar.json"))).not.toThrow();
  });

  it("parses footer.json", () => {
    expect(() => footerSchema.parse(readConfig("footer.json"))).not.toThrow();
  });

  it("accepts an absent theme.json (represented as {})", () => {
    expect(() => themeSchema.parse({})).not.toThrow();
  });
});

describe("theme schema: typography.fonts[].fallback", () => {
  const fontEntry = (fallback?: unknown) => ({
    role: "body",
    name: "Lora",
    provider: "google",
    ...(fallback === undefined ? {} : { fallback }),
  });

  it("accepts each generic family Astro can generate a metric-matched fallback for", () => {
    for (const fallback of ["serif", "sans-serif", "monospace", "system-ui"]) {
      expect(() =>
        themeSchema.parse({ typography: { fonts: [fontEntry(fallback)] } })
      ).not.toThrow();
    }
  });

  it("accepts an entry with no fallback at all", () => {
    expect(() => themeSchema.parse({ typography: { fonts: [fontEntry()] } })).not.toThrow();
  });

  it("rejects a generic family Astro has no fallback metrics for", () => {
    expect(() => themeSchema.parse({ typography: { fonts: [fontEntry("cursive")] } })).toThrow();
  });

  it("rejects an unknown value", () => {
    expect(() =>
      themeSchema.parse({ typography: { fonts: [fontEntry("not-a-real-generic")] } })
    ).toThrow();
  });
});

describe("removed keys are rejected with guidance", () => {
  it("rejects astro.ssr, pointing to astro.adapter", () => {
    const result = appSchema.safeParse({
      website: { title: "t", description: "d" },
      astro: { baseUrl: "https://example.com", basePath: "/", ssr: { enabled: true } },
    });
    expect(result.success).toBe(false);
    expect(z.prettifyError(result.error!)).toContain("astro.adapter");
  });

  it("rejects commerce.showBuyButton, pointing to commerce.mode", () => {
    const result = appSchema.safeParse({
      website: { title: "t", description: "d" },
      astro: { baseUrl: "https://example.com", basePath: "/" },
      commerce: { showBuyButton: true },
    });
    expect(result.success).toBe(false);
    expect(z.prettifyError(result.error!)).toContain("commerce.mode");
  });

  it("rejects commerce.locale, pointing to website.language", () => {
    const result = appSchema.safeParse({
      website: { title: "t", description: "d" },
      astro: { baseUrl: "https://example.com", basePath: "/" },
      commerce: { locale: "en-US" },
    });
    expect(result.success).toBe(false);
    expect(z.prettifyError(result.error!)).toContain("website.language");
  });

  it("rejects commerce.addToCartLabel, pointing to labels", () => {
    const result = appSchema.safeParse({
      website: { title: "t", description: "d" },
      astro: { baseUrl: "https://example.com", basePath: "/" },
      commerce: { addToCartLabel: "Buy" },
    });
    expect(result.success).toBe(false);
    expect(z.prettifyError(result.error!)).toContain("labels");
  });

  it("accepts commerce.mode without the removed keys", () => {
    const result = appSchema.safeParse({
      website: { title: "t", description: "d" },
      astro: { baseUrl: "https://example.com", basePath: "/" },
      commerce: { mode: "shop", cartInNavbar: true, showAddToCartOnCards: true },
    });
    expect(result.success).toBe(true);
  });
});

describe("app schema rejects unknown keys and wrong types (build-time gate)", () => {
  it("fails on an unknown top-level key", () => {
    const result = appSchema.safeParse({
      website: { title: "t", description: "d" },
      astro: { baseUrl: "https://example.com", basePath: "/" },
      notARealKey: true,
    });
    expect(result.success).toBe(false);
    expect(z.prettifyError(result.error!)).toContain("notARealKey");
  });

  it("fails when a field has the wrong type", () => {
    const result = appSchema.safeParse({
      website: { title: "t", description: "d" },
      astro: { baseUrl: "https://example.com", basePath: 123 },
    });
    expect(result.success).toBe(false);
    expect(z.prettifyError(result.error!)).toContain("basePath");
  });
});
