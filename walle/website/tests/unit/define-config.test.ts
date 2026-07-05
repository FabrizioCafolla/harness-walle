import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineWalleConfig } from "../../src/@walle/define-config";

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

vi.mock("../../src/configs/app.json", () => ({
  get default() {
    return appConfigMock;
  },
}));

vi.mock("node:fs", () => ({
  existsSync: () => fsExists,
  readFileSync: () => fsContent,
}));

describe("defineWalleConfig", () => {
  beforeEach(() => {
    appConfigMock = structuredClone(baseAppConfig);
    fsExists = false;
    fsContent = "";
  });

  it("throws on an unknown component variant, listing the available ones", () => {
    appConfigMock.components = { navbar: "not-a-real-variant" };
    expect(() => defineWalleConfig()).toThrow(
      /Unknown variant "not-a-real-variant".*standard, minimal/
    );
  });

  it("accepts a registered variant without throwing", () => {
    appConfigMock.components = { navbar: "minimal", footer: "standard" };
    expect(() => defineWalleConfig()).not.toThrow();
  });

  it("defaults to static output with no adapter when SSR is not configured", () => {
    const config = defineWalleConfig();
    expect(config.output).toBeUndefined();
    expect(config.adapter).toBeUndefined();
  });

  it("mounts the node adapter and server output when astro.ssr.enabled is true", () => {
    appConfigMock.astro.ssr = { enabled: true };
    const config = defineWalleConfig();
    expect(config.output).toBe("server");
    expect(config.adapter).toBeDefined();
  });

  it("concatenates consumer integrations onto the walle defaults instead of replacing them", () => {
    const marker = { name: "consumer-integration", hooks: {} };
    const config = defineWalleConfig({ integrations: [marker] });
    expect(config.integrations.length).toBeGreaterThan(1);
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
    expect(config.vite.build.rollupOptions.external).toEqual(
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
    const themePlugin = config.vite.plugins.find((p: { name: string }) => p.name === "walle-theme");
    const css = themePlugin!.load!("\0virtual:walle-theme.css") as string;
    expect(css).toContain("--walle-color-brand: #123456;");
    expect(css).toContain("--walle-font-body: Inter;");
    expect(css).toContain("--walle-font-size-md: 1rem;");
    expect(css).toContain("--walle-space-sm: 0.5rem;");
    expect(css).toContain("--walle-radius-sm: 4px;");
  });

  it("yields empty theme CSS when theme.json is absent", () => {
    const config = defineWalleConfig();
    const themePlugin = config.vite.plugins.find((p: { name: string }) => p.name === "walle-theme");
    expect(themePlugin!.load!("\0virtual:walle-theme.css")).toBe("");
  });

  it("yields empty theme CSS when theme.json is present but malformed", () => {
    fsExists = true;
    fsContent = "{not json";
    const config = defineWalleConfig();
    const themePlugin = config.vite.plugins.find((p: { name: string }) => p.name === "walle-theme");
    expect(themePlugin!.load!("\0virtual:walle-theme.css")).toBe("");
  });
});
