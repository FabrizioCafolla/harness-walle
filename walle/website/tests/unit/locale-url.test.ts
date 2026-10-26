import { describe, expect, it, vi } from "vitest";

const app = {
  astro: { trailingSlash: "always" },
  i18n: {
    defaultLocale: "it",
    locales: { it: { lang: "it-IT", label: "Italiano" }, en: { lang: "en-US", label: "English" } },
  } as Record<string, unknown>,
};
vi.mock("@walle/config", () => ({ default: { app } }));

const { localeCodes, localizedUrl, stripLocale } =
  await import("../../src/@walle/utils/locale-url");

describe("localizedUrl", () => {
  it("prefixes every language, the default included, by default", () => {
    expect(localizedUrl("en", "/posts/a/")).toBe("/en/posts/a/");
    expect(localizedUrl("it", "/posts/a/")).toBe("/it/posts/a/");
    expect(localizedUrl("en")).toBe("/en/");
  });

  it("leaves the default language unprefixed with prefixDefaultLocale false", () => {
    app.i18n.prefixDefaultLocale = false;
    expect(localizedUrl("it", "/posts/a/")).toBe("/posts/a/");
    expect(localizedUrl("it")).toBe("/");
    expect(localizedUrl("en", "/posts/a/")).toBe("/en/posts/a/");
    delete app.i18n.prefixDefaultLocale;
  });

  it("drops the slash after a bare language code when trailingSlash is never", () => {
    app.astro.trailingSlash = "never";
    expect(localizedUrl("en")).toBe("/en");
    app.astro.trailingSlash = "always";
  });
});

describe("stripLocale", () => {
  it("splits the language off a pathname", () => {
    expect(stripLocale("/en/posts/a/")).toEqual({ code: "en", path: "/posts/a/" });
    expect(stripLocale("/it")).toEqual({ code: "it", path: "/" });
  });

  it("is null outside every language", () => {
    expect(stripLocale("/404/")).toBeNull();
    expect(stripLocale("/english/")).toBeNull();
  });

  it("reads an unprefixed path as the default language with prefixDefaultLocale false", () => {
    app.i18n.prefixDefaultLocale = false;
    expect(stripLocale("/posts/a/")).toEqual({ code: "it", path: "/posts/a/" });
    delete app.i18n.prefixDefaultLocale;
  });
});

describe("localeCodes", () => {
  it("lists the declared languages in config order", () => {
    expect(localeCodes()).toEqual(["it", "en"]);
  });
});
