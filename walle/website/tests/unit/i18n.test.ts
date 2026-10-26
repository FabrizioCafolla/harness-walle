import { describe, expect, it, vi } from "vitest";

// vi.mock is file-scoped: this config has a language and a partial `labels` block, covering
// both a site label and the default fallback.
vi.mock("@walle/config", () => ({
  default: {
    app: {
      website: { language: "it-IT" },
      i18n: {
        defaultLocale: "it",
        locales: {
          it: { lang: "it-IT", label: "Italiano" },
          en: {
            lang: "en-GB",
            label: "English",
            labels: { skipLink: "Skip to the content", language: { nav: "Languages" } },
          },
        },
      },
      labels: {
        skipLink: "Vai al contenuto",
        carousel: { next: "Successivo" },
      },
    },
  },
}));

const { label, labeler, locale } = await import("../../src/@walle/utils/i18n");

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

describe("per-language labels", () => {
  it("a language's label wins over the base labels", () => {
    expect(label("skipLink", undefined, "en")).toBe("Skip to the content");
  });

  it("falls back to the base labels, then the default, for keys the language leaves out", () => {
    expect(label("carousel.next", undefined, "en")).toBe("Successivo");
    expect(label("carousel.previous", undefined, "en")).toBe("Previous slide");
  });

  it("a language without labels, or an unknown one, reads the base labels", () => {
    expect(label("skipLink", undefined, "it")).toBe("Vai al contenuto");
    expect(label("skipLink", undefined, "xx")).toBe("Vai al contenuto");
  });

  it("a prop override still wins over the language", () => {
    expect(label("skipLink", "Mine", "en")).toBe("Mine");
  });

  it("labeler binds the language", () => {
    expect(labeler("en")("language.nav")).toBe("Languages");
    expect(labeler()("language.nav")).toBe("Language");
  });

  it("locale(code) is the language's BCP 47 tag, the site language without one", () => {
    expect(locale("en")).toBe("en-GB");
    expect(locale("xx")).toBe("it-IT");
    expect(locale()).toBe("it-IT");
  });
});
