import type { OgFont } from "./fonts";
import type { OgTheme } from "./theme";

export type OgEntry = { title: string; subtitle?: string; data: Record<string, unknown> };

/**
 * A satori-compatible element tree. Satori's input type is `ReactNode` from "react", which is
 * not installed; satori only needs this object shape, cast in `renderOgElement`.
 */
export type SatoriElement = {
  type: string;
  props: {
    children?: SatoriElement | SatoriElement[] | string | null | (SatoriElement | null)[];
    style?: Record<string, string | number>;
    [key: string]: unknown;
  };
};

export type OgTemplate = (_entry: OgEntry, _theme: OgTheme) => SatoriElement;

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Lays an element tree out with satori and rasterizes it with resvg's async API, which runs on
 * the libuv threadpool (the sync `Resvg#render` blocks the event loop). Both libraries are
 * imported dynamically, so a site without `seo.ogImage` does not load satori/resvg's native
 * binary. Exported for a site endpoint that composes its own tree.
 */
export async function renderOgElement(
  element: SatoriElement,
  fonts: OgFont[],
  size: { width: number; height: number } = { width: WIDTH, height: HEIGHT }
): Promise<Buffer> {
  const [{ default: satori }, { renderAsync }] = await Promise.all([
    import("satori"),
    import("@resvg/resvg-js"),
  ]);

  // satori types `element` as `react`'s ReactNode (not installed) and `fonts[].weight` as a
  // fixed Weight union; walle's config types weight as a plain number.
  const svg = await satori(element as unknown as Parameters<typeof satori>[0], {
    ...size,
    fonts: fonts.map((font) => ({
      name: font.name,
      data: font.data,
      weight: font.weight ?? 400,
      style: font.style ?? "normal",
    })) as unknown as Parameters<typeof satori>[1]["fonts"],
  });

  return (await renderAsync(svg)).asPng();
}

/** Renders one OG image: the template's element tree through {@link renderOgElement}. */
export async function renderOgImage(
  entry: OgEntry,
  options: { template: OgTemplate; theme: OgTheme }
): Promise<Buffer> {
  const { template, theme } = options;
  return renderOgElement(template(entry, theme), theme.fonts);
}
