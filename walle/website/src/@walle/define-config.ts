// Build-time walle config resolution. Imported only by astro.config.mjs (via the
// `defineWalleConfig` re-export in ./config). Kept out of the runtime config module
// so components importing `config` don't pull astro/config into their graph.
import AstroPWA from "@vite-pwa/astro";
import node from "@astrojs/node";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import appConfig from "../configs/app.json";
import footerConfigJson from "../configs/footer.json";
import navbarConfigJson from "../configs/navbar.json";

import { appSchema, footerSchema, navbarSchema, parseConfig, themeSchema } from "./config/schema";

/**
 * Components a site can replace, once, from `app.json`'s `components` block (D6): each key's
 * built-in name → walle source file, resolved relative to this file's own directory. A value
 * can also be a `./`-prefixed path to a site component under `src/`. Absent keys default to
 * `"standard"`. The keys of each inner record are also the available built-in names for that
 * component, so this is the one place both are defined.
 */
const WALLE_COMPONENT_PATHS: Record<string, Record<string, string>> = {
  navbar: {
    standard: "./components/features/Navbar/Navbar.astro",
    minimal: "./components/features/Navbar/Navbar.minimal.astro",
  },
  footer: {
    standard: "./components/features/Footer.astro",
    minimal: "./components/features/Footer.minimal.astro",
  },
  card: { standard: "./components/features/Card/BasicCard.astro" },
  breadcrumbs: { standard: "./components/features/Breadcrumbs.astro" },
  pageHeader: { standard: "./components/features/Sections/HeaderStandard.astro" },
  toc: { standard: "./components/features/Blog/BlogTableOfContents.astro" },
};

/**
 * Resolves one `components.<key>` entry to an absolute file path: a recognized built-in name
 * to its walle source file, or a `./`-prefixed value to a site file that must exist, as a file
 * (not a directory), under the project's `src/`. Throws naming the key and the offending value
 * otherwise (never a silent fallback), so an invalid override fails the build instead of
 * surfacing as a missing component at request time. The caller has already rejected an
 * unrecognized `key`, so `WALLE_COMPONENT_PATHS[key]` is always defined here.
 */
function resolveEmbeddedComponent(key: string, value: string, root: string): string {
  const available = WALLE_COMPONENT_PATHS[key];
  if (value.startsWith("./")) {
    const abs = resolve(root, value);
    const srcRoot = resolve(root, "src") + sep;
    if (!abs.startsWith(srcRoot)) {
      throw new Error(
        `[walle] components.${key} points to "${value}", which is outside src/. ` +
          `Component overrides must live under the project's src/ directory.`
      );
    }
    if (!existsSync(abs) || !statSync(abs).isFile()) {
      throw new Error(
        `[walle] components.${key} points to "${value}", but that file does not exist.`
      );
    }
    return abs;
  }
  if (!(value in available)) {
    throw new Error(
      `[walle] Unknown value "${value}" for components.${key}. ` +
        `Available: ${Object.keys(available).join(", ")}.`
    );
  }
  return fileURLToPath(new URL(available[value], import.meta.url));
}

/** Validates every key of `components` (rejecting one that names no embeddable at all) and
 * resolves each embeddable's entry, defaulting an absent key to `"standard"`. */
function resolveEmbeddedComponents(
  components: Record<string, string> = {},
  root: string
): Record<string, string> {
  for (const key of Object.keys(components)) {
    if (!(key in WALLE_COMPONENT_PATHS)) {
      throw new Error(
        `[walle] Unknown embeddable component "${key}" in app.json "components". ` +
          `Available: ${Object.keys(WALLE_COMPONENT_PATHS).join(", ")}.`
      );
    }
  }
  const resolved: Record<string, string> = {};
  for (const key of Object.keys(WALLE_COMPONENT_PATHS)) {
    resolved[key] = resolveEmbeddedComponent(key, components[key] ?? "standard", root);
  }
  return resolved;
}

/**
 * Vite plugin exposing `virtual:walle-components`: one `export { default as <key> }` per
 * embeddable, from whichever file `resolveEmbeddedComponents` resolved it to. Layouts import
 * from this module instead of a per-component resolver, so only the selected implementation
 * ever enters a page's module graph.
 */
function walleComponentsPlugin(root: string, components: Record<string, string> = {}) {
  const virtualId = "virtual:walle-components";
  const resolvedId = "\0" + virtualId;
  return {
    name: "walle-components",
    resolveId(id: string) {
      return id === virtualId ? resolvedId : null;
    },
    load(id: string) {
      if (id !== resolvedId) return null;
      const resolved = resolveEmbeddedComponents(components, root);
      return Object.entries(resolved)
        .map(([key, path]) => `export { default as ${key} } from ${JSON.stringify(path)};`)
        .join("\n");
    },
  };
}

/**
 * Deterministic token → CSS var mapping.
 *   palette.<name>               → --walle-color-<name>   (includes *-contrast, heading)
 *   typography.fontFamilyBase    → --walle-font-body
 *   typography.fontFamilyHeading → --walle-font-heading
 *   typography.fontFamilyMono    → --walle-font-mono
 *   typography.scale.<name>      → --walle-font-size-<name>
 *   spacing.<name>               → --walle-space-<name>
 *   radii.<name>                 → --walle-radius-<name>
 *   neutral.<name>                → --walle-gray-<name>
 *   shadow.<name>                 → --walle-shadow-<name>
 *
 * tokens.css bridges each --walle-* var to the component-facing var (e.g. --primary,
 * --space-sm, --radius-sm, --gray-light, --shadow-md) so theme.json overrides work without
 * touching consumer files. Absent or empty theme.json yields an empty string — output is
 * identical to defaults.
 */
function readThemeJson(): Record<string, any> {
  const themeUrl = new URL("../configs/theme.json", import.meta.url);
  if (!existsSync(fileURLToPath(themeUrl))) return {};
  try {
    return JSON.parse(readFileSync(themeUrl, "utf8"));
  } catch {
    return {};
  }
}

function generateThemeCss(): string {
  const themeUrl = new URL("../configs/theme.json", import.meta.url);
  if (!existsSync(fileURLToPath(themeUrl))) return "";

  let theme: {
    palette?: Record<string, unknown>;
    typography?: {
      fontFamilyBase?: string;
      fontFamilyHeading?: string;
      fontFamilyMono?: string;
      scale?: Record<string, string>;
    };
    spacing?: Record<string, unknown>;
    radii?: Record<string, unknown>;
    neutral?: Record<string, unknown>;
    shadow?: Record<string, unknown>;
  };
  try {
    theme = JSON.parse(readFileSync(themeUrl, "utf8"));
  } catch {
    return "";
  }

  const lines: string[] = [];

  for (const [name, value] of Object.entries(theme?.palette ?? {})) {
    if (typeof value === "string" && value.length > 0)
      lines.push(`  --walle-color-${name}: ${value};`);
  }

  const typo = theme?.typography;
  if (typo?.fontFamilyBase) lines.push(`  --walle-font-body: ${typo.fontFamilyBase};`);
  if (typo?.fontFamilyHeading) lines.push(`  --walle-font-heading: ${typo.fontFamilyHeading};`);
  if (typo?.fontFamilyMono) lines.push(`  --walle-font-mono: ${typo.fontFamilyMono};`);
  for (const [name, value] of Object.entries(typo?.scale ?? {})) {
    if (typeof value === "string") lines.push(`  --walle-font-size-${name}: ${value};`);
  }

  for (const [name, value] of Object.entries(theme?.spacing ?? {})) {
    if (typeof value === "string" && value.length > 0)
      lines.push(`  --walle-space-${name}: ${value};`);
  }

  for (const [name, value] of Object.entries(theme?.radii ?? {})) {
    if (typeof value === "string" && value.length > 0)
      lines.push(`  --walle-radius-${name}: ${value};`);
  }

  for (const [name, value] of Object.entries(theme?.neutral ?? {})) {
    if (typeof value === "string" && value.length > 0)
      lines.push(`  --walle-gray-${name}: ${value};`);
  }

  for (const [name, value] of Object.entries(theme?.shadow ?? {})) {
    if (typeof value === "string" && value.length > 0)
      lines.push(`  --walle-shadow-${name}: ${value};`);
  }

  return lines.length ? `:root {\n${lines.join("\n")}\n}\n` : "";
}

/**
 * Vite plugin exposing the generated theme tokens as a virtual CSS module. Imported by
 * AbstractLayout between the walle base styles and the consumer `global.css`, so the
 * cascade is: walle defaults < generated tokens < consumer global.css (consumer wins).
 */
function walleThemePlugin() {
  const virtualId = "virtual:walle-theme.css";
  const resolvedId = "\0" + virtualId;
  return {
    name: "walle-theme",
    resolveId(id: string) {
      return id === virtualId ? resolvedId : null;
    },
    load(id: string) {
      return id === resolvedId ? generateThemeCss() : null;
    },
  };
}

/**
 * Barrel modules (`@walle/components`, `@walle/layouts`) are a DX win and a payload bug:
 * Astro collects a page's CSS from its module graph, not from what the page renders, so one
 * `import { Section } from "@walle/components"` drags every component's <style> onto every
 * page — carousel, cart, blog and product CSS included on a site that has none of them.
 * (Measured on eventialatina.it: 79 kB shared stylesheet, 35 kB of it for components no page
 * ever rendered.)
 *
 * This plugin rewrites each barrel at load time down to the exports the project actually
 * imports from it, scanning the consumer's own sources for the named imports. Nothing about
 * how consumers write imports changes; what changes is what ends up in the graph.
 */
function walleSlimBarrelsPlugin(root: string) {
  const BARRELS: Record<string, string> = {
    "src/@walle/components/index.js": "@walle/components",
    "src/@walle/layouts/index.js": "@walle/layouts",
  };
  const targets = Object.entries(BARRELS).map(([rel, spec]) => [resolve(root, rel), spec] as const);
  const barrelFiles = new Set(targets.map(([file]) => file));
  const used = new Map<string, Set<string>>();

  function collect(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        collect(full);
        continue;
      }
      if (!/\.(astro|ts|js|mjs|md|mdx)$/.test(entry.name) || barrelFiles.has(full)) continue;
      const source = readFileSync(full, "utf8");
      for (const [, spec] of targets) {
        const pattern = new RegExp(
          `import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s+from\\s+["']${spec}["']`,
          "g"
        );
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(source)) !== null) {
          for (const name of match[1].split(",")) {
            const clean = name
              .trim()
              .replace(/^type\s+/, "")
              .split(/\s+as\s+/)[0];
            if (clean) used.get(spec)!.add(clean);
          }
        }
      }
    }
  }

  return {
    name: "walle-slim-barrels",
    enforce: "pre" as const,
    buildStart() {
      for (const [, spec] of targets) used.set(spec, new Set());
      collect(resolve(root, "src"));
    },
    load(id: string) {
      const hit = targets.find(([file]) => id.split("?")[0] === file);
      if (!hit) return null;
      const keep = used.get(hit[1])!;
      return readFileSync(hit[0], "utf8")
        .split("\n")
        .filter((line) => {
          // Two re-export shapes: a walle source file (`default as X`) and a virtual-module
          // export (`navbar as Navbar` from `virtual:walle-components`, D6's embeddable
          // components). Both are filtered by the barrel's own exported name, one per line.
          const exported =
            line.match(/export\s+\{\s*default\s+as\s+(\w+)\s*\}/) ||
            line.match(
              /export\s+\{\s*\w+\s+as\s+(\w+)\s*\}\s+from\s+["']virtual:walle-components["']/
            );
          return !exported || keep.has(exported[1]);
        })
        .join("\n");
    },
  };
}

type PwaConfigSection = {
  enabled?: boolean;
  name?: string;
  shortName?: string;
  description?: string;
  lang?: string;
  themeColor?: string;
  backgroundColor?: string;
  display?: string;
  startUrl?: string;
  scope?: string;
  icons?: Record<string, unknown>[];
  appleTouchIcon?: string;
};

/**
 * Progressive web app support, off unless `pwa.enabled` is true in app.json. Disabled means
 * the integration is never mounted: no manifest, no service worker, no registration script,
 * nothing added to any page.
 *
 * Everything the manifest needs already exists elsewhere in a walle project, so the defaults
 * read from there (website title/description/language, theme palette, base path) and a
 * consumer only writes what actually differs. The Astro-side knobs (`workbox`, `registerType`,
 * …) are deliberately NOT in app.json: they are code-shaped, not content-shaped, so they are
 * overridden natively from astro.config via `defineWalleConfig({ pwa: { workbox: … } })` and
 * merged one level deep over the defaults below.
 *
 * `injectRegister: "script-defer"` on purpose: vite-plugin-pwa cannot inject anything into
 * Astro's static HTML output (it relies on a transformIndexHtml pass Astro's build doesn't
 * run — the generated file lands in dist/ but no page ever references it), so Head.astro
 * emits the tag itself. The generated registerSW.js already registers inside a `load`
 * listener, which keeps the worker off the critical path and avoids pulling workbox-window
 * into the page bundle at all.
 */
function wallePwaIntegration(
  app: { website?: Record<string, any>; astro?: Record<string, any>; pwa?: PwaConfigSection },
  overrides: Record<string, any> = {}
) {
  const pwa = app.pwa ?? {};
  if (pwa.enabled !== true) return [];

  const palette = (readThemeJson().palette ?? {}) as Record<string, string>;
  const base = app.astro?.basePath || "/";
  const name = pwa.name ?? app.website?.title ?? "";

  const defaults = {
    registerType: "autoUpdate" as const,
    injectRegister: "script-defer" as const,
    manifest: {
      name,
      short_name: pwa.shortName ?? name,
      description: pwa.description ?? app.website?.description ?? "",
      lang: pwa.lang ?? app.website?.language,
      theme_color: pwa.themeColor ?? palette.primary,
      background_color: pwa.backgroundColor ?? palette.background,
      display: pwa.display ?? "standalone",
      start_url: pwa.startUrl ?? base,
      scope: pwa.scope ?? base,
      icons: pwa.icons ?? [],
    },
    workbox: {
      // Only the hashed, immutable build output is precached; HTML is handled by the
      // network-first rule below instead, so a page is never served from a stale cache
      // while the network is available.
      globPatterns: ["_astro/**/*.{js,css}"],
      // Explicitly off. vite-plugin-pwa defaults this to "/", which emits a NavigationRoute
      // bound to a URL that is not in the precache above: it throws `non-precached-url` at
      // module evaluation, before any runtimeCaching rule is registered, and the worker
      // silently caches nothing at all (vite-pwa/vite-plugin-pwa#731, #400).
      navigateFallback: null,
      runtimeCaching: [
        {
          urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
          handler: "NetworkFirst",
          options: { cacheName: "html-pages", networkTimeoutSeconds: 3 },
        },
      ],
    },
  };

  return [
    AstroPWA({
      ...defaults,
      ...overrides,
      manifest: { ...defaults.manifest, ...(overrides.manifest ?? {}) },
      workbox: {
        ...defaults.workbox,
        ...(overrides.workbox ?? {}),
        // Consumer rules first, then walle's: Workbox takes the first route that matches,
        // so a consumer can both add rules and override a default one without having to
        // restate the defaults it still wants.
        runtimeCaching: [
          ...((overrides.workbox?.runtimeCaching ?? []) as unknown[]),
          ...defaults.workbox.runtimeCaching,
        ],
      },
    } as Parameters<typeof AstroPWA>[0]),
  ];
}

/**
 * The three tags Head.astro emits for a PWA, resolved once here rather than re-derived at
 * render time: the manifest link, the browser-chrome color and the iOS icon. Head.astro reads
 * them from `virtual:walle-pwa`, so the theme palette stays a single source of truth (a
 * consumer's `src/configs/index.js` is seed-owned and may not expose `theme` at all) and a
 * disabled PWA is simply `{ enabled: false }`.
 */
function wallePwaHeadPlugin(head: Record<string, unknown>) {
  const virtualId = "virtual:walle-pwa";
  const resolvedId = "\0" + virtualId;
  return {
    name: "walle-pwa-head",
    resolveId(id: string) {
      return id === virtualId ? resolvedId : null;
    },
    load(id: string) {
      return id === resolvedId ? `export default ${JSON.stringify(head)};` : null;
    },
  };
}

function resolvePwaHead(
  app: { astro?: Record<string, any>; pwa?: PwaConfigSection },
  overrides: Record<string, any> = {}
) {
  const pwa = app.pwa ?? {};
  if (pwa.enabled !== true) return { enabled: false };
  const base = (app.astro?.basePath || "/").replace(/\/$/, "");
  const palette = (readThemeJson().palette ?? {}) as Record<string, string>;
  return {
    enabled: true,
    manifestHref: `${base}/manifest.webmanifest`,
    registerHref: `${base}/registerSW.js`,
    themeColor: overrides.manifest?.theme_color ?? pwa.themeColor ?? palette.primary ?? null,
    appleTouchIcon: pwa.appleTouchIcon ? `${base}${pwa.appleTouchIcon}` : null,
  };
}

type AstroConfigSection = {
  baseUrl?: string;
  basePath?: string;
  trailingSlash?: "always" | "never" | "ignore";
  /** Adds the node adapter (`output` stays Astro's default, `"static"`): only routes that
   * declare `prerender = false` render on demand, everything else stays a static file. */
  adapter?: "node";
  /** Path prefixes to keep out of sitemap.xml. For pages that exist as a routable URL but must
   * not be indexed (a `noindex` status page such as an offline fallback): listing one in the
   * sitemap while its own meta says `noindex` is the "Submitted URL marked noindex" conflict
   * Search Console reports. Absent key = every page is listed, as before. */
  sitemapExclude?: string[];
  /** Passed straight through to Astro's native `redirects` config. Astro's own static-output
   * redirect page already emits refresh/noindex/canonical; walle additionally excludes every
   * redirect source from sitemap.xml (D9), same as `sitemapExclude`. */
  redirects?: Record<string, string | { destination: string; status: 301 | 302 | 307 | 308 }>;
  /** `false` opts out entirely; otherwise maps to Astro's own `prefetch` config, defaulting to
   * `{ prefetchAll: true, defaultStrategy: "hover" }` when absent (D9 — walle's own default,
   * Astro itself defaults to off). */
  prefetch?: false | { strategy?: "hover" | "tap" | "viewport" | "load"; all?: boolean };
};

/**
 * True when `pathname` (as `new URL(page).pathname` hands it — includes the site's base path)
 * falls under one of `excludes` (bare paths, written without the base, e.g. `"/old-page"`).
 * Strips `base` off the front and normalizes a trailing slash on both sides before comparing,
 * so a site with `astro.basePath` set (any GitHub Pages project site) and an exclude/redirect
 * entry written with or without a trailing slash both still match. Exported and pure so it's
 * unit-testable without going through the sitemap integration's own hook lifecycle.
 */
export function isSitemapExcluded(pathname: string, excludes: string[], base?: string): boolean {
  const normalize = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p) || "/";
  const strippedBase = base && base !== "/" ? base.replace(/\/$/, "") : "";
  const withoutBase =
    strippedBase && pathname.startsWith(strippedBase)
      ? pathname.slice(strippedBase.length) || "/"
      : pathname;
  const path = normalize(withoutBase);
  return excludes.some((exclude) => {
    const p = normalize(exclude);
    return path === p || path.startsWith(p === "/" ? "/" : `${p}/`);
  });
}

/**
 * Resolve the Astro config from the consumer's app.json plus optional native overrides.
 * Override semantics (additive merge): scalar keys from the consumer win over the
 * walle-resolved values; `integrations` are concatenated onto the walle defaults
 * (mdx, sitemap, icon), never replaced.
 */
export function defineWalleConfig(overrides: Record<string, any> = {}) {
  // Single build-time gate for all four config files (D7): a malformed or outdated config
  // fails here, loudly, instead of surfacing later as a runtime import error or a silently
  // wrong page.
  parseConfig(appSchema, appConfig, "app.json");
  parseConfig(navbarSchema, navbarConfigJson, "navbar.json");
  parseConfig(footerSchema, footerConfigJson, "footer.json");
  parseConfig(themeSchema, readThemeJson(), "theme.json");

  const astro = (appConfig.astro ?? {}) as AstroConfigSection;
  const components = (appConfig as { components?: Record<string, string> }).components;
  // Fail fast, at config-build time, the same as the parseConfig calls above: an invalid
  // override surfaces here, not as a missing component the first time a page renders.
  resolveEmbeddedComponents(components, process.cwd());

  // Redirect sources never belong in the sitemap alongside their own destination — same
  // exclusion mechanism as sitemapExclude, just fed from a different config key (D9).
  const redirectSources = Object.keys(astro.redirects ?? {});
  const sitemapExclude = [...(astro.sitemapExclude ?? []), ...redirectSources];
  const walleIntegrations = [
    mdx(),
    sitemap(
      sitemapExclude.length > 0
        ? {
            filter: (page: string) =>
              !isSitemapExcluded(new URL(page).pathname, sitemapExclude, astro.basePath),
          }
        : undefined
    ),
    icon(),
  ];

  const {
    integrations: consumerIntegrations = [],
    vite: consumerVite = {},
    // Not an Astro key: native overrides for the PWA integration walle mounts itself.
    pwa: consumerPwa = {},
    ...consumerScalars
  } = overrides;

  const pwaIntegrations = wallePwaIntegration(appConfig as Record<string, any>, consumerPwa);
  const pwaHead = resolvePwaHead(appConfig as Record<string, any>, consumerPwa);

  return defineConfig({
    site: astro.baseUrl,
    base: astro.basePath,
    trailingSlash: astro.trailingSlash,
    // No adapter (default) => fully static, identical to today. `adapter: "node"` adds the
    // node adapter without setting `output`, so it stays Astro's default ("static") and only
    // `prerender = false` routes render on demand through the adapter.
    ...(astro.adapter === "node" ? { adapter: node({ mode: "standalone" }) } : {}),
    redirects: astro.redirects,
    // Consumer scalar keys override the walle-resolved values.
    ...consumerScalars,
    integrations: [...walleIntegrations, ...pwaIntegrations, ...consumerIntegrations],
    vite: {
      ...consumerVite,
      plugins: [
        walleThemePlugin(),
        walleComponentsPlugin(process.cwd(), components),
        wallePwaHeadPlugin(pwaHead),
        walleSlimBarrelsPlugin(process.cwd()),
        ...(consumerVite.plugins ?? []),
      ],
      build: {
        ...consumerVite.build,
        rollupOptions: {
          ...consumerVite.build?.rollupOptions,
          // Astro's opt-in rust compiler (experimental.rustCompiler, off by default)
          // dynamically imports @astrojs/compiler-rs, which is intentionally not
          // installed. Externalize it so the build doesn't try to bundle it. Still
          // required on astro 6.4.x; safe to drop once astro externalizes it itself.
          external: [
            "@astrojs/compiler-rs",
            ...toExternalArray(consumerVite.build?.rollupOptions?.external),
          ],
        },
      },
    },
  });
}

function toExternalArray(external: unknown): string[] {
  if (Array.isArray(external)) return external.filter((e): e is string => typeof e === "string");
  if (typeof external === "string") return [external];
  return [];
}
