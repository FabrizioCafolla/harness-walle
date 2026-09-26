import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineWalleConfig } from "../../src/@walle/define-config";

// generateThemeCss() is private to define-config.ts; exercised the same way
// define-config.test.ts does, through the "walle-theme" virtual-module plugin it registers.
const baseAppConfig = {
  astro: { baseUrl: "https://example.com", basePath: "/", trailingSlash: "never" as const },
  website: { title: "t", description: "d" },
  components: {} as Record<string, string>,
};

let appConfigMock = structuredClone(baseAppConfig);
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

// defineWalleConfig() always sets vite.plugins to a plain array of walle's own plugin objects
// (never a Promise/false/nested array as Vite's wider PluginOption allows), so this narrows the
// type once instead of asserting through it at every call site.
type ThemePlugin = { name: string; load: (id: string) => string | null };

function themeCss(): string {
  const config = defineWalleConfig();
  const plugins = config.vite!.plugins as unknown as ThemePlugin[];
  const themePlugin = plugins.find((p) => p.name === "walle-theme")!;
  return themePlugin.load("\0virtual:walle-theme.css") as string;
}

describe("generateThemeCss (token table)", () => {
  beforeEach(() => {
    appConfigMock = structuredClone(baseAppConfig);
    fsExists = false;
    fsContent = "";
  });

  it("maps every token family from a full theme.json to its --walle-* line", () => {
    fsExists = true;
    fsContent = JSON.stringify({
      palette: {
        primary: "#111111",
        "primary-contrast": "#ffffff",
        heading: "#222222",
      },
      typography: {
        fontFamilyBase: "Inter",
        scale: { h1: "3rem", body: "1rem" },
      },
      spacing: { sm: "0.5rem" },
      radii: { sm: "4px" },
      neutral: { base: "#e9ebee", light: "#f4f5f7" },
      shadow: { md: "0 1px 2px rgba(0,0,0,0.1)" },
    });

    const css = themeCss();
    expect(css).toContain("--walle-color-primary: #111111;");
    expect(css).toContain("--walle-color-primary-contrast: #ffffff;");
    expect(css).toContain("--walle-color-heading: #222222;");
    expect(css).toContain("--walle-font-body: Inter;");
    expect(css).toContain("--walle-font-size-h1: 3rem;");
    expect(css).toContain("--walle-font-size-body: 1rem;");
    expect(css).toContain("--walle-space-sm: 0.5rem;");
    expect(css).toContain("--walle-radius-sm: 4px;");
    expect(css).toContain("--walle-gray-base: #e9ebee;");
    expect(css).toContain("--walle-gray-light: #f4f5f7;");
    expect(css).toContain("--walle-shadow-md: 0 1px 2px rgba(0,0,0,0.1);");
  });

  it("yields empty output for an empty theme.json object", () => {
    fsExists = true;
    fsContent = "{}";
    expect(themeCss()).toBe("");
  });
});
