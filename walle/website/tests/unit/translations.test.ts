import { describe, expect, it, vi } from "vitest";

const entries: Record<string, { data: { draft?: boolean } }> = {
  "it/a": { data: {} },
  "en/a": { data: {} },
  "it/b": { data: {} },
  "it/c": { data: {} },
  "en/c": { data: { draft: true } },
};
vi.mock("astro:content", () => ({
  getCollection: async (_collection: string, filter: (e: unknown) => boolean) =>
    Object.entries(entries)
      .map(([id, e]) => ({ id, ...e }))
      .filter(filter),
}));
vi.mock("@walle/config", () => ({
  default: {
    app: {
      i18n: {
        defaultLocale: "it",
        locales: { it: { lang: "it-IT", label: "I" }, en: { lang: "en-US", label: "E" } },
      },
    },
  },
}));

const { getTranslations, splitLocaleId } = await import("../../src/@walle/utils/translations");

describe("getTranslations", () => {
  it("lists every language in which the same path exists", async () => {
    expect(await getTranslations("posts", "it/a")).toEqual(["it", "en"]);
  });

  it("omits a language without the entry", async () => {
    expect(await getTranslations("posts", "it/b")).toEqual(["it"]);
  });

  it("treats a draft translation as missing", async () => {
    expect(await getTranslations("posts", "it/c")).toEqual(["it"]);
  });
});

describe("splitLocaleId", () => {
  it("keeps nested paths", () => {
    expect(splitLocaleId("en/2024/a")).toEqual({ code: "en", path: "2024/a" });
  });
});
