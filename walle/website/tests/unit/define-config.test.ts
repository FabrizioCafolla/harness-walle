import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineWalleConfig } from "../../src/@walle/define-config";

// defineWalleConfig() always sets vite.plugins to a plain array of walle's own plugin objects
// (never a Promise/false/nested array as Vite's wider PluginOption allows), so this narrows the
// type once instead of asserting through it at every call site.
type ThemePlugin = { name: string; load: (id: string) => string | null };

function findThemePlugin(config: ReturnType<typeof defineWalleConfig>): ThemePlugin {
  const plugins = config.vite!.plugins as unknown as ThemePlugin[];
  return plugins.find((p) => p.name === "walle-theme")!;
}

// define-config.ts reads appConfig.* and theme.json fresh on every defineWalleConfig() call
// (no caching at module scope), so mutating these mocks between tests is enough — no need to
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
