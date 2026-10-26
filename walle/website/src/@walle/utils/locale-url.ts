import config from "@walle/config";
import { stripBase } from "./base-path";
import { resolveInternalUrl } from "./helpers";

/** Declared language codes in config order; empty on a monolingual site. */
export function localeCodes(): string[] {
  return Object.keys(config.app.i18n?.locales ?? {});
}

/**
 * URL of `path` (written without base path or language, e.g. "/posts/a/") in the language
 * `code`: the language prefix and the base path are added, and the default language gets no
 * prefix when `i18n.prefixDefaultLocale` is `false`.
 */
export function localizedUrl(code: string, path = "/"): string {
  const i18n = config.app.i18n;
  const unprefixed = i18n?.prefixDefaultLocale === false && code === i18n.defaultLocale;
  const prefix = unprefixed ? "" : `/${code}`;
  if (path === "/") {
    const bare = config.app.astro.trailingSlash === "never" && prefix !== "";
    return resolveInternalUrl(bare ? prefix : `${prefix}/`);
  }
  return resolveInternalUrl(`${prefix}${path}`);
}

/**
 * Splits a request pathname (base path included) into its language code and the rest, or `null`
 * when the page is outside every language (a monolingual site, `/404`).
 */
export function stripLocale(pathname: string): { code: string; path: string } | null {
  const i18n = config.app.i18n;
  if (!i18n) return null;
  const rel = stripBase(pathname, import.meta.env.BASE_URL);
  const m = rel.match(/^\/([^/]+)(\/.*)?$/);
  if (m && m[1] in i18n.locales) return { code: m[1], path: m[2] ?? "/" };
  return i18n.prefixDefaultLocale === false ? { code: i18n.defaultLocale, path: rel } : null;
}
