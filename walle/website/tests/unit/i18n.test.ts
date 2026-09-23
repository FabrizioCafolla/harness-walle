import { describe, expect, it, vi } from "vitest";

// One mocked config per file (vi.mock's file-scoped hoisting means every test in a file shares
// it — see VariantPicker.locale-default.test.ts). This file's config has a language and a
// partial `labels` block, so it can exercise both "site label present" and "falls back to the
// default because this key was never overridden" in the same run.
vi.mock("@walle/config", () => ({
  default: {
    app: {
      website: { language: "it-IT" },
      labels: {
        skipLink: "Vai al contenuto",
        carousel: { next: "Successivo" },
      },
    },
  },
}));

const { label, locale } = await import("../../src/@walle/utils/i18n");

describe("locale", () => {
  it("returns the site's configured language", () => {
    expect(locale()).toBe("it-IT");
  });
});

describe("label precedence: prop override > site label > default", () => {
  it("uses the site label when one is configured for this key", () => {
    expect(label("skipLink")).toBe("Vai al contenuto");
  });

  it("resolves a nested path to a site label", () => {
    expect(label("carousel.next")).toBe("Successivo");
  });

  it("falls back to the English default when the site never set this key", () => {
    expect(label("breadcrumbs.nav")).toBe("Breadcrumb");
    expect(label("carousel.previous")).toBe("Previous slide");
  });

  it("a component prop override wins over a configured site label", () => {
    expect(label("skipLink", "Custom skip")).toBe("Custom skip");
  });

  it("a component prop override wins over the default too", () => {
    expect(label("breadcrumbs.nav", "Custom nav")).toBe("Custom nav");
  });

  it("an empty string override is respected, not treated as absent", () => {
    expect(label("skipLink", "")).toBe("");
  });
});
