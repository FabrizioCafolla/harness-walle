import themeData from "virtual:walle-theme-data";
import config from "@walle/config";
import type { NavbarLogo } from "@walle/config";
import { resolveOgFonts, type OgFont, type OgImageFontConfig } from "./fonts";

// Same fallbacks tokens.css uses when theme.json has no palette.
const DEFAULT_PALETTE = { primary: "#243b6b", background: "#fefefe", foreground: "#161616" };

export type OgTheme = {
  siteTitle: string;
  logo: NavbarLogo;
  primary: string;
  background: string;
  foreground: string;
  fonts: OgFont[];
};

/**
 * Palette, fonts, site title and logo a template renders against, resolved from the parsed
 * config. `root` resolves relative font paths from `seo.ogImage.fonts`/`typography.fonts`
 * and defaults to the process cwd.
 */
export function resolveOgTheme(root: string = process.cwd()): OgTheme {
  const palette = { ...DEFAULT_PALETTE, ...themeData.palette };
  const ogImageFonts = config.app.seo?.ogImage?.fonts as OgImageFontConfig[] | undefined;
  const fonts = resolveOgFonts(ogImageFonts, themeData.fonts, root);

  return {
    siteTitle: config.app.website.title,
    logo: config.navbar.logo,
    primary: palette.primary,
    background: palette.background,
    foreground: palette.foreground,
    fonts,
  };
}
