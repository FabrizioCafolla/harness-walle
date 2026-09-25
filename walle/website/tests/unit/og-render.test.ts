import { describe, expect, it } from "vitest";
import { renderOgImage } from "../../src/@walle/og/render";
import { resolveOgFonts } from "../../src/@walle/og/fonts";
import defaultTemplate, { truncateTitle } from "../../src/@walle/og/templates/default";
import type { OgTheme } from "../../src/@walle/og/theme";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngDimensions(png: Buffer): { width: number; height: number } {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

// No app.json/theme.json involved: fonts.ts falls back to the bundled font with no config at
// all, so the theme is a plain literal here rather than going through resolveOgTheme (which is
// theme.ts's own concern: config-parsing coverage, not render.ts's).
const theme: OgTheme = {
  siteTitle: "Test Site",
  logo: { url: "/" },
  primary: "#243b6b",
  background: "#fefefe",
  foreground: "#161616",
  fonts: resolveOgFonts(undefined, undefined, process.cwd()),
};

describe("renderOgImage", () => {
  it("produces a 1200x630 PNG entirely offline", async () => {
    const originalFetch = globalThis.fetch;
    // Fails loudly instead of silently passing if anything in the pipeline ever tries to
    // reach the network (fonts/rendering must work with zero connectivity). satori's own
    // yoga-layout WASM loader calls `fetch()` on a local `data:` URI to decode its embedded
    // binary, not a real network request, so only a real http(s) URL trips this.
    globalThis.fetch = ((input: RequestInfo | URL, ...rest: unknown[]) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith("http:") || url.startsWith("https:")) {
        throw new Error(`renderOgImage must never reach the network (fetched ${url})`);
      }
      return originalFetch(input as RequestInfo, ...(rest as []));
    }) as typeof fetch;

    try {
      const png = await renderOgImage(
        { title: "Hello world", data: {} },
        { template: defaultTemplate, theme }
      );
      expect(png.subarray(0, 8)).toEqual(PNG_SIGNATURE);
      expect(pngDimensions(png)).toEqual({ width: 1200, height: 630 });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("truncateTitle", () => {
  it("leaves a short title untouched", () => {
    expect(truncateTitle("Short title")).toBe("Short title");
  });

  it("truncates a long title with a trailing ellipsis, capped at the max length", () => {
    const longTitle = "A very long product title that keeps going ".repeat(5);
    const truncated = truncateTitle(longTitle);
    expect(truncated.length).toBeLessThanOrEqual(90);
    expect(truncated.endsWith("…")).toBe(true);
    expect(longTitle.startsWith(truncated.slice(0, -1))).toBe(true);
  });

  it("respects a custom max length", () => {
    expect(truncateTitle("Hello world", 5)).toBe("Hell…");
  });
});
