// Single source of truth for the shape of src/configs/{app,navbar,footer,theme}.json: the
// config types are inferred from these schemas and schemas/*.schema.json is generated from
// them (walle/cli/generate-schemas.mjs). define-config.ts (build) and config/index.ts
// (runtime) both parse with them and throw on a mismatch.
import { z } from "astro/zod";

// Re-exported for walle/cli/generate-schemas.mjs, where "astro/zod" does not resolve.
export { z };

/**
 * Declares a removed key: it stays a known property (so `.strict()` reports the guidance
 * message instead of "unrecognized key") but only validates when absent.
 */
function removedKey(guidance: string) {
  const message = `This key has been removed. Use "${guidance}" instead.`;
  return (
    z
      .unknown()
      .optional()
      .refine((value) => value === undefined, { message })
      // `refine` has no JSON Schema form; `not: {}` makes ajv reject the key whenever present.
      .meta({ not: {}, description: message })
  );
}

const logoSchema = z
  .object({
    src: z.string().optional(),
    // Navbar only: light version of `src`, shown instead of it over a transparent menu
    // (`data-navbar-overlay`), before the page scrolls.
    srcInverse: z.string().optional(),
    title: z.string().optional(),
    url: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    alt: z.string().optional(),
    cssClasses: z.string().optional(),
    license: z.string().optional(),
  })
  .strict();

const navigationTarget = z.enum(["_blank", "_self"]);

const dropdownLinkSchema = z
  .object({
    name: z.string().optional(),
    url: z.string(),
    icon: z.string().optional(),
    target: navigationTarget.optional(),
  })
  .strict();

const navigationLinkSchema = z
  .object({
    name: z.string().optional(),
    url: z.string(),
    icon: z.string().optional(),
    target: navigationTarget.optional(),
    dropdown: z.array(dropdownLinkSchema).optional(),
    // `button` renders the item as a `Button` (desktop and mobile panel) instead of a text link;
    // `variant` picks its color and only applies to a button. Ignored when `dropdown` is set.
    type: z.enum(["link", "button"]).optional(),
    variant: z.enum(["primary", "secondary", "alternative", "site"]).optional(),
    // Draws a button as an outline (border and text in the variant color).
    outline: z.boolean().optional(),
  })
  .strict();

const footerLinkSchema = z
  .object({
    name: z.string().optional(),
    url: z.string(),
    icon: z.string().optional(),
    target: navigationTarget.optional(),
  })
  .strict();

export const navbarSchema = z
  .object({
    $schema: z.string().optional(),
    logo: logoSchema,
    items: z.array(navigationLinkSchema),
  })
  .strict();

export const footerSchema = z
  .object({
    $schema: z.string().optional(),
    logo: logoSchema,
    items: z.array(footerLinkSchema),
  })
  .strict();

const websiteSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    favicon: z.string().optional(),
    image: z.string().optional(),
    robots: z.string().optional(),
    language: z.string().optional(),
    titleMaxLength: z.number().int().min(20).optional(),
    descriptionMaxLength: z.number().int().min(50).optional(),
    // Entries laid over the `WebSite` / `Organization` JSON-LD nodes every page emits: a key
    // replaces the generated one, a new key is added, `null` removes it (shallow merge).
    // Without it the nodes carry name, url, logo and, for Organization, `sameAs` from the
    // footer's icon links.
    structuredData: z
      .object({
        website: z.record(z.string(), z.unknown()).optional(),
        organization: z.record(z.string(), z.unknown()).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const astroSchema = z
  .object({
    baseUrl: z.string(),
    basePath: z.string(),
    trailingSlash: z.enum(["always", "never", "ignore"]).optional(),
    analyticsScriptContent: z.string().optional(),
    sitemapExclude: z.array(z.string()).optional(),
    // Passed through to Astro's `redirects`, whose static redirect page emits
    // refresh/noindex/canonical; walle also excludes each redirect source from the sitemap.
    redirects: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z
            .object({
              destination: z.string(),
              status: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]),
            })
            .strict(),
        ])
      )
      .optional(),
    // Adds the node adapter with `output` left at Astro's default ("static"): only routes
    // that declare `prerender = false` render on demand.
    adapter: z.enum(["node"]).optional(),
    ssr: removedKey("astro.adapter"),
    // Astro's `prefetch` is off by default; walle defaults it on with the hover strategy and
    // `false` opts out. `strategy`/`all` map to Astro's `defaultStrategy`/`prefetchAll`.
    prefetch: z
      .union([
        z.literal(false),
        z
          .object({
            strategy: z.enum(["hover", "tap", "viewport", "load"]).optional(),
            all: z.boolean().optional(),
          })
          .strict(),
      ])
      .optional(),
  })
  .strict();

const pwaIconSchema = z
  .object({
    src: z.string(),
    sizes: z.string(),
    type: z.string().optional(),
    purpose: z.string().optional(),
  })
  .strict();

const pwaSchema = z
  .object({
    enabled: z.boolean().optional(),
    name: z.string().optional(),
    shortName: z.string().optional(),
    description: z.string().optional(),
    lang: z.string().optional(),
    themeColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    display: z.enum(["standalone", "fullscreen", "minimal-ui", "browser"]).optional(),
    startUrl: z.string().optional(),
    scope: z.string().optional(),
    icons: z.array(pwaIconSchema).optional(),
    appleTouchIcon: z.string().optional(),
    // Offline fallback route: `true` uses walle's managed page, a `./`-prefixed string swaps
    // in a site file (same contract as `commerce.pages.*`). Requires `enabled: true`.
    offline: z.union([z.literal(true), z.string()]).optional(),
  })
  .strict();

const commerceSchema = z
  .object({
    // Off by default: no cart UI, no /products gating. "catalog" shows products with no
    // buy controls (a showcase); "shop" is the full cart + checkout flow.
    mode: z.enum(["off", "catalog", "shop"]).default("off"),
    cartInNavbar: z.boolean().optional(),
    showAddToCartOnCards: z.boolean().optional(),
    // Site overrides for the two injected commerce routes: `./`-prefixed paths under
    // src/, same validation as `components.*`. Absent = walle's own managed pages.
    pages: z
      .object({
        list: z.string().optional(),
        detail: z.string().optional(),
      })
      .strict()
      .optional(),
    showBuyButton: removedKey("commerce.mode"),
    locale: removedKey("website.language"),
    addToCartLabel: removedKey("labels"),
  })
  .strict();

const breadcrumbsLabelsSchema = z
  .object({ nav: z.string().optional(), back: z.string().optional(), home: z.string().optional() })
  .strict();

const carouselLabelsSchema = z
  .object({
    previous: z.string().optional(),
    next: z.string().optional(),
    zoom: z.string().optional(),
    close: z.string().optional(),
    slide: z.string().optional(),
  })
  .strict();

const filtersLabelsSchema = z
  .object({
    searchPlaceholder: z.string().optional(),
    searchLabel: z.string().optional(),
    clear: z.string().optional(),
    status: z.string().optional(),
    facetSelect: z.string().optional(),
    facetSelected: z.string().optional(),
  })
  .strict();

const cartLabelsSchema = z
  .object({
    ariaLabel: z.string().optional(),
    open: z.string().optional(),
    title: z.string().optional(),
    close: z.string().optional(),
    empty: z.string().optional(),
    subtotal: z.string().optional(),
    checkout: z.string().optional(),
    add: z.string().optional(),
    decreaseQuantity: z.string().optional(),
    increaseQuantity: z.string().optional(),
    remove: z.string().optional(),
    inStock: z.string().optional(),
    outOfStock: z.string().optional(),
    unavailable: z.string().optional(),
  })
  .strict();

const priceLabelsSchema = z
  .object({
    discounted: z.string().optional(),
    original: z.string().optional(),
  })
  .strict();

const offlineLabelsSchema = z
  .object({
    title: z.string().optional(),
    message: z.string().optional(),
  })
  .strict();

const notFoundLabelsSchema = z
  .object({
    title: z.string().optional(),
    message: z.string().optional(),
  })
  .strict();

const cardLabelsSchema = z.object({ read: z.string().optional() }).strict();

const productsLabelsSchema = z
  .object({
    title: z.string().optional(),
    type: z.string().optional(),
    searchPlaceholder: z.string().optional(),
    status: z.string().optional(),
    empty: z.string().optional(),
    related: z.string().optional(),
    galleryHeading: z.string().optional(),
    gallery: z.string().optional(),
  })
  .strict();

const mapLabelsSchema = z
  .object({
    directions: z.string().optional(),
    region: z.string().optional(),
  })
  .strict();

const tocLabelsSchema = z
  .object({
    heading: z.string().optional(),
    nav: z.string().optional(),
    loading: z.string().optional(),
    expanded: z.string().optional(),
    collapsed: z.string().optional(),
    toggle: z.string().optional(),
    navigateTo: z.string().optional(),
    navigated: z.string().optional(),
  })
  .strict();

const navLabelsSchema = z
  .object({
    main: z.string().optional(),
    toggle: z.string().optional(),
  })
  .strict();

const footerLabelsSchema = z
  .object({
    nav: z.string().optional(),
    social: z.string().optional(),
  })
  .strict();

const blogLabelsSchema = z
  .object({
    publishedOn: z.string().optional(),
    readingProgress: z.string().optional(),
    articleNavigation: z.string().optional(),
    previousArticle: z.string().optional(),
    nextArticle: z.string().optional(),
    info: z.string().optional(),
    tags: z.string().optional(),
    empty: z.string().optional(),
  })
  .strict();

// Every user-facing/screen-reader string walle emits, grouped by area. Each leaf has an
// English default in i18n.ts; a component prop for the same label overrides the site value.
const labelsSchema = z
  .object({
    skipLink: z.string().optional(),
    scrollableRegion: z.string().optional(),
    logo: z.string().optional(),
    card: cardLabelsSchema.optional(),
    breadcrumbs: breadcrumbsLabelsSchema.optional(),
    carousel: carouselLabelsSchema.optional(),
    filters: filtersLabelsSchema.optional(),
    cart: cartLabelsSchema.optional(),
    price: priceLabelsSchema.optional(),
    offline: offlineLabelsSchema.optional(),
    notFound: notFoundLabelsSchema.optional(),
    toc: tocLabelsSchema.optional(),
    readingTime: z.string().optional(),
    nav: navLabelsSchema.optional(),
    footer: footerLabelsSchema.optional(),
    blog: blogLabelsSchema.optional(),
    products: productsLabelsSchema.optional(),
    map: mapLabelsSchema.optional(),
  })
  .strict();

// OG images. `enabled` defaults to false; the seeded app.json turns it on. Absent
// `templates`/`fonts` mean walle's managed default template and bundled fallback font.
const ogImageFontSchema = z
  .object({
    name: z.string(),
    path: z.string(),
    weight: z.number().optional(),
    style: z.enum(["normal", "italic"]).optional(),
  })
  .strict();

const ogImageSchema = z
  .object({
    enabled: z.boolean().optional(),
    collections: z.array(z.string()).optional(),
    // Site-path overrides, same `./`-prefixed contract as `components.*`/`commerce.pages.*`.
    // Keyed by collection name, plus the reserved "default" key.
    templates: z.record(z.string(), z.string()).optional(),
    fonts: z.array(ogImageFontSchema).optional(),
  })
  .strict();

// RSS feeds. `fields` maps the feed's title/description/date/categories to the collection's
// schema keys (e.g. `date` -> `publishDate`).
const feedFieldsSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    date: z.string().optional(),
    categories: z.string().optional(),
  })
  .strict();

const feedItemSchema = z
  .object({
    collection: z.string(),
    path: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    fields: feedFieldsSchema.optional(),
    // `{id}` substituted per entry: the collection entry's own detail page.
    link: z.string(),
    // Newest entries kept; 50 when unset.
    limit: z.number().optional(),
    excludeDrafts: z.boolean().optional(),
  })
  .strict();

const feedsSchema = z
  .object({
    enabled: z.boolean().optional(),
    items: z.array(feedItemSchema).optional(),
  })
  .strict();

// Renders a <link rel="alternate"> for a feed the site serves itself. No route is injected.
const alternateSchema = z
  .object({
    href: z.string(),
    type: z.enum(["application/rss+xml", "application/atom+xml", "application/feed+json"]),
    title: z.string().optional(),
  })
  .strict();

const seoSchema = z
  .object({
    ogImage: ogImageSchema.optional(),
    feeds: feedsSchema.optional(),
    alternates: z.array(alternateSchema).optional(),
  })
  .strict();

// Map. Absent means walle's own defaults: standard OpenStreetMap tiles, "google"
// directions.
const mapTilesSchema = z
  .object({
    url: z.string(),
    attribution: z.string(),
    subdomains: z.string().optional(),
    maxZoom: z.number().optional(),
  })
  .strict();

const mapSchema = z
  .object({
    tiles: mapTilesSchema.optional(),
    directions: z.enum(["google", "osm", "apple", "none"]).optional(),
  })
  .strict();

export const appSchema = z
  .object({
    $schema: z.string().optional(),
    website: websiteSchema,
    astro: astroSchema,
    components: z.record(z.string(), z.string()).optional(),
    pwa: pwaSchema.optional(),
    commerce: commerceSchema.optional(),
    labels: labelsSchema.optional(),
    seo: seoSchema.optional(),
    map: mapSchema.optional(),
  })
  .strict();

const themePaletteSchema = z.record(z.string(), z.string()).optional();
const themeScaleSchema = z.record(z.string(), z.string()).optional();

// One entry per font family: mapped by define-config.ts to an Astro `fonts` entry with
// `cssVariable: "--walle-font-<role>"` and exposed at runtime through `virtual:walle-fonts`.
const fontEntrySchema = z
  .object({
    role: z.enum(["body", "heading", "mono"]),
    name: z.string(),
    provider: z.enum(["local", "google", "fontsource"]),
    weights: z.array(z.union([z.string(), z.number()])).optional(),
    styles: z.array(z.enum(["normal", "italic", "oblique"])).optional(),
    // Local-only: relative font file path(s) for a single @font-face variant covering the
    // whole `weights` range (a variable font). Per-weight static files are not supported.
    src: z.array(z.string()).optional(),
    // true preloads every weight/style/subset combination Astro generated for this family;
    // false preloads none; an array preloads only the listed weight/style/subset
    // combinations. Passed straight through to Astro's own <Font preload> filter.
    preload: z
      .union([
        z.boolean(),
        z.array(
          z
            .object({
              weight: z.union([z.string(), z.number()]).optional(),
              style: z.enum(["normal", "italic", "oblique"]).optional(),
              subset: z.string().optional(),
            })
            .strict()
        ),
      ])
      .optional(),
    // Generic family used while the font loads or if it fails. Astro generates a
    // metric-matched fallback @font-face only for these generics. Default "sans-serif".
    fallback: z.enum(["serif", "sans-serif", "monospace", "system-ui"]).optional(),
    // CSS font-display. Absent: Astro's default ("swap") applies.
    display: z.enum(["auto", "block", "fallback", "optional", "swap"]).optional(),
  })
  .strict();

const themeTypographySchema = z
  .object({
    fontFamilyBase: z.string().optional(),
    fontFamilyHeading: z.string().optional(),
    fontFamilyMono: z.string().optional(),
    scale: themeScaleSchema,
    fonts: z.array(fontEntrySchema).optional(),
  })
  .strict();

export const themeSchema = z
  .object({
    $schema: z.string().optional(),
    palette: themePaletteSchema,
    typography: themeTypographySchema.optional(),
    spacing: z.record(z.string(), z.string()).optional(),
    radii: z.record(z.string(), z.string()).optional(),
    neutral: z.record(z.string(), z.string()).optional(),
    shadow: z.record(z.string(), z.string()).optional(),
  })
  .strict();

export type AppConfig = z.infer<typeof appSchema>;
export type NavbarConfig = z.infer<typeof navbarSchema>;
export type FooterConfig = z.infer<typeof footerSchema>;
export type ThemeConfig = z.infer<typeof themeSchema>;
export type NavigationLink = z.infer<typeof navigationLinkSchema>;
export type NavbarLogo = z.infer<typeof logoSchema>;
export type LabelsConfig = z.infer<typeof labelsSchema>;

/** Parses `data` against `schema`, throwing a `z.prettifyError` message prefixed with `fileName`. */
export function parseConfig<T>(schema: z.ZodType<T>, data: unknown, fileName: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid walle config in ${fileName}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
