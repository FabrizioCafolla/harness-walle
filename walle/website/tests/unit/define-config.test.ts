import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  defineWalleConfig,
  isSitemapExcluded,
  resolvePwaOptions,
  withBase,
} from "../../src/@walle/define-config";

// defineWalleConfig() always sets vite.plugins to a plain array of walle's own plugin objects
// (never a Promise/false/nested array as Vite's wider PluginOption allows), so this narrows the
// type once instead of asserting through it at every call site.
type ThemePlugin = { name: string; load: (id: string) => string | null };

function findThemePlugin(config: ReturnType<typeof defineWalleConfig>): ThemePlugin {
  const plugins = config.vite!.plugins as unknown as ThemePlugin[];
  return plugins.find((p) => p.name === "walle-theme")!;
}

// define-config.ts reads appConfig.* and theme.json fresh on every defineWalleConfig() call
// (no caching at module scope), so mutating these mocks between tests is enough: no need to
// re-import the module per test.
const baseAppConfig = {
  astro: { baseUrl: "https://example.com", basePath: "/", trailingSlash: "never" as const },
  website: {
    title: "t",
    description: "d",
    favicon: "/f",
    image: "/i",
    robots: "index, follow",
    language: "en",
  },
  components: {} as Record<string, string>,
};

let appConfigMock: typeof baseAppConfig & { astro: { ssr?: { enabled?: boolean } } } =
  structuredClone(baseAppConfig);
let fsExists = false;
let fsContent = "";
let fsIsFile = true;

vi.mock("../../src/configs/app.json", () => ({
  get default() {
    return appConfigMock;
  },
}));

vi.mock("node:fs", () => ({
  existsSync: () => fsExists,
  readFileSync: () => fsContent,
  statSync: () => ({ isFile: () => fsIsFile }),
}));

describe("defineWalleConfig", () => {
  beforeEach(() => {
    appConfigMock = structuredClone(baseAppConfig);
    fsExists = false;
    fsContent = "";
    fsIsFile = true;
  });

  it("throws referencing app.json and the key path for an unknown key", () => {
    (appConfigMock as Record<string, unknown>).notARealKey = true;
    expect(() => defineWalleConfig()).toThrow(/app\.json/);
    expect(() => defineWalleConfig()).toThrow(/notARealKey/);
  });

  it("throws referencing app.json and the key path for a wrong type", () => {
    (appConfigMock.website as Record<string, unknown>).title = 123;
    expect(() => defineWalleConfig()).toThrow(/app\.json/);
    expect(() => defineWalleConfig()).toThrow(/title/);
  });

  it("throws on an unknown value for an embeddable component, listing the available ones", () => {
    appConfigMock.components = { navbar: "not-a-real-variant" };
    expect(() => defineWalleConfig()).toThrow(
      /"not-a-real-variant".*components\.navbar.*standard, minimal/
    );
  });

  it("throws on an unknown embeddable key, listing the available ones", () => {
    appConfigMock.components = { notAnEmbeddable: "standard" };
    expect(() => defineWalleConfig()).toThrow(
      /notAnEmbeddable.*navbar, footer, card, breadcrumbs, pageHeader, toc/
    );
  });

  it("accepts a registered variant without throwing", () => {
    appConfigMock.components = { navbar: "minimal", footer: "standard" };
    expect(() => defineWalleConfig()).not.toThrow();
  });

  it("accepts a site path under src/ that exists", () => {
    fsExists = true;
    appConfigMock.components = { card: "./src/components/EventCard.astro" };
    expect(() => defineWalleConfig()).not.toThrow();
  });

  it("throws naming the key and the missing path when a site override does not exist", () => {
    fsExists = false;
    appConfigMock.components = { card: "./src/components/Nope.astro" };
    expect(() => defineWalleConfig()).toThrow(/components\.card.*Nope\.astro/);
  });

  it("throws when a site path resolves outside src/", () => {
    appConfigMock.components = { card: "./scripts/evil.astro" };
    expect(() => defineWalleConfig()).toThrow(/components\.card.*outside src/);
  });

  it("throws naming the path when a site override points to a directory, not a file", () => {
    fsExists = true;
    fsIsFile = false;
    appConfigMock.components = { card: "./src/components" };
    expect(() => defineWalleConfig()).toThrow(/components\.card.*src\/components/);
  });

  it("defaults to static output with no adapter when SSR is not configured", () => {
    const config = defineWalleConfig();
    expect(config.output).toBeUndefined();
    expect(config.adapter).toBeUndefined();
  });

  it("rejects astro.ssr with guidance to use astro.adapter", () => {
    appConfigMock.astro.ssr = { enabled: true };
    expect(() => defineWalleConfig()).toThrow(/astro\.adapter/);
  });

  it("defaults prefetch to hover with prefetchAll on when astro.prefetch is absent", () => {
    const config = defineWalleConfig();
    expect(config.prefetch).toEqual({ prefetchAll: true, defaultStrategy: "hover" });
  });

  it("opts out of prefetch entirely when astro.prefetch is false", () => {
    (appConfigMock.astro as Record<string, unknown>).prefetch = false;
    const config = defineWalleConfig();
    expect(config.prefetch).toBe(false);
  });

  it("maps astro.prefetch.strategy/all to Astro's defaultStrategy/prefetchAll", () => {
    (appConfigMock.astro as Record<string, unknown>).prefetch = { strategy: "load", all: false };
    const config = defineWalleConfig();
    expect(config.prefetch).toEqual({ prefetchAll: false, defaultStrategy: "load" });
  });

  it("concatenates consumer integrations onto the walle defaults instead of replacing them", () => {
    const marker = { name: "consumer-integration", hooks: {} };
    const config = defineWalleConfig({ integrations: [marker] });
    expect(config.integrations!.length).toBeGreaterThan(1);
    expect(config.integrations).toContain(marker);
  });

  it("lets consumer scalar overrides win over walle-resolved values", () => {
    const config = defineWalleConfig({ site: "https://override.example" });
    expect(config.site).toBe("https://override.example");
  });

  it("always externalizes @astrojs/compiler-rs and preserves consumer externals", () => {
    const config = defineWalleConfig({
      vite: { build: { rollupOptions: { external: ["consumer-external"] } } },
    });
    expect(config.vite!.build!.rollupOptions!.external).toEqual(
      expect.arrayContaining(["@astrojs/compiler-rs", "consumer-external"])
    );
  });

  it("generates --walle-* CSS vars from theme.json tokens", () => {
    fsExists = true;
    fsContent = JSON.stringify({
      palette: { brand: "#123456" },
      typography: { fontFamilyBase: "Inter", scale: { md: "1rem" } },
      spacing: { sm: "0.5rem" },
      radii: { sm: "4px" },
    });
    const config = defineWalleConfig();
    const themePlugin = findThemePlugin(config);
    const css = themePlugin.load("\0virtual:walle-theme.css") as string;
    expect(css).toContain("--walle-color-brand: #123456;");
    expect(css).toContain("--walle-font-body: Inter;");
    expect(css).toContain("--walle-font-size-md: 1rem;");
    expect(css).toContain("--walle-space-sm: 0.5rem;");
    expect(css).toContain("--walle-radius-sm: 4px;");
  });

  it("yields empty theme CSS when theme.json is absent", () => {
    const config = defineWalleConfig();
    const themePlugin = findThemePlugin(config);
    expect(themePlugin.load("\0virtual:walle-theme.css")).toBe("");
  });

  it("yields empty theme CSS when theme.json is present but malformed", () => {
    fsExists = true;
    fsContent = "{not json";
    const config = defineWalleConfig();
    const themePlugin = findThemePlugin(config);
    expect(themePlugin.load("\0virtual:walle-theme.css")).toBe("");
  });
});

describe("isSitemapExcluded", () => {
  it("matches an exact path with no base configured", () => {
    expect(isSitemapExcluded("/old-page", ["/old-page"])).toBe(true);
    expect(isSitemapExcluded("/other-page", ["/old-page"])).toBe(false);
  });

  it("strips a configured base path before comparing", () => {
    expect(isSitemapExcluded("/harness-walle/old-page", ["/old-page"], "/harness-walle")).toBe(
      true
    );
    expect(isSitemapExcluded("/harness-walle/other-page", ["/old-page"], "/harness-walle")).toBe(
      false
    );
  });

  it("normalizes a trailing slash on either side", () => {
    expect(isSitemapExcluded("/old-page/", ["/old-page"])).toBe(true);
    expect(isSitemapExcluded("/old-page", ["/old-page/"])).toBe(true);
  });

  it("excludes a nested path under an excluded prefix", () => {
    expect(isSitemapExcluded("/offline/details", ["/offline"])).toBe(true);
    expect(isSitemapExcluded("/offline-plan", ["/offline"])).toBe(false);
  });

  it("excluding the root only matches the root itself, never every page", () => {
    expect(isSitemapExcluded("/", ["/"])).toBe(true);
    expect(isSitemapExcluded("/about", ["/"])).toBe(false);
  });

  it("strips the base only at a path-segment boundary", () => {
    expect(isSitemapExcluded("/harness-walle-docs/x", ["/x"], "/harness-walle")).toBe(false);
    expect(isSitemapExcluded("/harness-walle/x", ["/x"], "/harness-walle")).toBe(true);
  });
});

describe("withBase", () => {
  it("leaves the destination untouched when no base is configured", () => {
    expect(withBase("/products/example")).toBe("/products/example");
    expect(withBase("/products/example", "/")).toBe("/products/example");
  });

  it("prefixes the base onto an internal root-relative destination", () => {
    expect(withBase("/products/example", "/harness-walle")).toBe(
      "/harness-walle/products/example"
    );
  });

  it("is idempotent when the destination already carries the base", () => {
    expect(withBase("/harness-walle/products/example", "/harness-walle")).toBe(
      "/harness-walle/products/example"
    );
    expect(withBase("/harness-walle", "/harness-walle")).toBe("/harness-walle");
  });

  it("leaves an external https destination untouched", () => {
    expect(withBase("https://example.com/x", "/harness-walle")).toBe("https://example.com/x");
  });

  it("leaves a protocol-relative destination untouched", () => {
    expect(withBase("//example.com/x", "/harness-walle")).toBe("//example.com/x");
  });

  it("prefixes the destination inside the object form, keeping status", () => {
    const redirects = {
      "/old": { destination: "/new", status: 301 as const },
    };
    const [source, target] = Object.entries(redirects)[0];
    expect(source).toBe("/old");
    expect({ ...target, destination: withBase(target.destination, "/harness-walle") }).toEqual({
      destination: "/harness-walle/new",
      status: 301,
    });
  });
});

describe("resolvePwaOptions", () => {
  it("returns null when pwa.enabled is not true", () => {
    expect(resolvePwaOptions({})).toBeNull();
    expect(resolvePwaOptions({ pwa: { enabled: false } })).toBeNull();
  });

  it("has no offline precache entry or handlerDidError when pwa.offline is unset", () => {
    const options = resolvePwaOptions({ pwa: { enabled: true } })!;
    expect(options.workbox.additionalManifestEntries).toEqual([]);
    expect(options.workbox.runtimeCaching[0].options.plugins).toBeUndefined();
  });

  it("adds a base-prefixed additionalManifestEntries entry with a real revision when pwa.offline is set", () => {
    const options = resolvePwaOptions({
      astro: { basePath: "/harness-walle" },
      pwa: { enabled: true, offline: true },
    })!;
    expect(options.workbox.additionalManifestEntries).toHaveLength(1);
    const [entry] = options.workbox.additionalManifestEntries;
    expect(entry.url).toBe("/harness-walle/offline");
    // Must change across builds so a stale offline page isn't served forever (revision: null
    // means "already versioned", which a plain unhashed URL like this never is).
    expect(entry.revision).not.toBeNull();
    expect(typeof entry.revision).toBe("string");
    expect(entry.revision.length).toBeGreaterThan(0);
  });

  it("collapses a '/' basePath so the offline URL has no double slash", () => {
    const options = resolvePwaOptions({
      astro: { basePath: "/" },
      pwa: { enabled: true, offline: true },
    })!;
    expect(options.workbox.additionalManifestEntries[0].url).toBe("/offline");
  });

  it("wires a handlerDidError on the navigate rule that resolves to caches.match(offlineUrl)", async () => {
    const options = resolvePwaOptions({
      astro: { basePath: "/harness-walle" },
      pwa: { enabled: true, offline: true },
    })!;
    const [rule] = options.workbox.runtimeCaching;
    const handlerDidError = rule.options.plugins[0].handlerDidError;
    expect(typeof handlerDidError).toBe("function");

    const match = vi.fn().mockResolvedValue("cached-response");
    (globalThis as { caches?: unknown }).caches = { match };
    await expect(handlerDidError()).resolves.toBe("cached-response");
    expect(match).toHaveBeenCalledWith("/harness-walle/offline", { ignoreSearch: true });
    delete (globalThis as { caches?: unknown }).caches;
  });

  it("merges a consumer additionalManifestEntries onto walle's own instead of replacing it", () => {
    const options = resolvePwaOptions(
      { astro: { basePath: "/" }, pwa: { enabled: true, offline: true } },
      { workbox: { additionalManifestEntries: [{ url: "/custom", revision: "1" }] } }
    )!;
    expect(options.workbox.additionalManifestEntries).toHaveLength(2);
    expect(options.workbox.additionalManifestEntries[0].url).toBe("/offline");
    expect(options.workbox.additionalManifestEntries[1]).toEqual({ url: "/custom", revision: "1" });
  });

  it("precaches _astro/fonts/**/*.woff2 alongside the default js/css glob", () => {
    const options = resolvePwaOptions({ pwa: { enabled: true } })!;
    expect(options.workbox.globPatterns).toEqual(
      expect.arrayContaining(["_astro/**/*.{js,css}", "_astro/fonts/**/*.woff2"])
    );
  });

  it("has no globIgnores when commerce is in shop mode", () => {
    const options = resolvePwaOptions({ pwa: { enabled: true }, commerce: { mode: "shop" } })!;
    expect(options.workbox.globIgnores).toEqual([]);
  });

  it("ignores commerce chunk patterns as a safety net when commerce is not shop", () => {
    const off = resolvePwaOptions({ pwa: { enabled: true }, commerce: { mode: "off" } })!;
    expect(off.workbox.globIgnores).toEqual(
      expect.arrayContaining(["**/_astro/Cart*", "**/_astro/VariantPicker*"])
    );
    const catalog = resolvePwaOptions({ pwa: { enabled: true }, commerce: { mode: "catalog" } })!;
    expect(catalog.workbox.globIgnores.length).toBeGreaterThan(0);
    const noCommerce = resolvePwaOptions({ pwa: { enabled: true } })!;
    expect(noCommerce.workbox.globIgnores.length).toBeGreaterThan(0);
  });

  it("merges a consumer globIgnores onto walle's own instead of replacing it", () => {
    const options = resolvePwaOptions(
      { pwa: { enabled: true }, commerce: { mode: "shop" } },
      { workbox: { globIgnores: ["**/consumer-ignored/*"] } }
    )!;
    expect(options.workbox.globIgnores).toEqual(["**/consumer-ignored/*"]);
  });
});
