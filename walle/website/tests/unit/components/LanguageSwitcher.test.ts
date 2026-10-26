import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

// File-scoped mock: a two-language site.
vi.mock("@walle/config", () => ({
  default: {
    app: {
      astro: { trailingSlash: "always" },
      website: { title: "Example", description: "Example site", language: "it-IT" },
      i18n: {
        defaultLocale: "it",
        locales: {
          it: { lang: "it-IT", label: "Italiano" },
          en: { lang: "en-US", label: "English", labels: { language: { nav: "Languages" } } },
        },
      },
    },
  },
}));

const { default: LanguageSwitcher } =
  await import("../../../src/@walle/components/features/LanguageSwitcher.astro");
const { default: Head } = await import("../../../src/@walle/components/features/Head.astro");

const render = async (component: unknown, pathname: string, props: object, locale = "it") => {
  const container = await AstroContainer.create({
    astroConfig: {
      site: "https://example.com",
    },
    manifest: {
      i18n: {
        defaultLocale: "it",
        locales: ["it", "en"],
        strategy: "pathname-prefix-always",
        fallback: undefined,
        fallbackType: "redirect",
      },
    } as never,
  });
  return container.renderToString(
    component as never,
    {
      request: new Request(`https://example.com${pathname}`),
      locals: {},
      props,
      // The Container API takes the locale from the route when i18n is configured.
      partial: true,
      params: { lang: locale },
    } as never
  );
};

describe("LanguageSwitcher", () => {
  it("offers the languages the page exists in, linked to the same page", async () => {
    const html = await render(LanguageSwitcher, "/it/posts/a/", { translations: ["it", "en"] });
    expect(html).toContain('href="/it/posts/a/"');
    expect(html).toContain('href="/en/posts/a/"');
    expect(html).toContain('hreflang="en-US"');
    expect(html).toContain("English");
    expect(html).toMatch(/hreflang="it-IT"[^>]*aria-current="true"/);
    expect(html).toContain('aria-label="Language"');
  });

  it("reads the nav label of the page's language", async () => {
    const html = await render(
      LanguageSwitcher,
      "/en/posts/a/",
      { translations: ["it", "en"] },
      "en"
    );
    expect(html).toContain('aria-label="Languages"');
    expect(html).toMatch(/hreflang="en-US"[^>]*aria-current="true"/);
  });

  it("offers only the languages listed", async () => {
    const html = await render(LanguageSwitcher, "/it/posts/a/", { translations: ["it", "xx"] });
    expect(html).toBe("");
  });

  it("renders nothing when the page exists in one language", async () => {
    const html = await render(LanguageSwitcher, "/it/posts/b/", { translations: ["it"] });
    expect(html).not.toContain("<nav");
  });
});

describe("Head hreflang", () => {
  const props = { title: "Page", description: "Description" };

  it("links every translation and x-default to the default language", async () => {
    const html = await render(Head, "/en/posts/a/", { ...props, translations: ["it", "en"] });
    expect(html).toContain('hreflang="it-IT" href="https://example.com/it/posts/a/"');
    expect(html).toContain('hreflang="en-US" href="https://example.com/en/posts/a/"');
    expect(html).toContain('hreflang="x-default" href="https://example.com/it/posts/a/"');
  });

  it("emits none for a page that exists in one language", async () => {
    const html = await render(Head, "/it/posts/b/", { ...props, translations: ["it"] });
    expect(html).not.toContain("hreflang");
  });
});
