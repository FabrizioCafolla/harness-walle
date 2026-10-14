/**
 * Base-path helpers shared by build-time config (`define-config.ts`) and request-time code
 * (`og/url.ts`, `feeds/route.ts`): no astro/config imports.
 */

/**
 * Strips `base` off the front of `pathname` at a path-segment boundary: "/harness-walle-docs/x"
 * does not lose "/harness-walle". Returns `pathname` unchanged when `base` is absent, `"/"`, or doesn't actually prefix it.
 */
export function stripBase(pathname: string, base: string | undefined): string {
  const stripped = base && base !== "/" ? base.replace(/\/$/, "") : "";
  if (stripped && (pathname === stripped || pathname.startsWith(`${stripped}/`))) {
    return pathname.slice(stripped.length) || "/";
  }
  return pathname;
}

/**
 * Prefixes `base` onto a root-relative destination: Astro's `redirects` applies `base` to the
 * source pattern but not to the destination. Leaves external (`http(s):`/`//`) destinations
 * and ones already starting with the base untouched (idempotent).
 */
export function withBase(destination: string, base?: string): string {
  if (!base || base === "/") return destination;
  if (!destination.startsWith("/") || destination.startsWith("//")) return destination;
  const strippedBase = base.replace(/\/$/, "");
  if (destination === strippedBase || destination.startsWith(`${strippedBase}/`)) {
    return destination;
  }
  return `${strippedBase}${destination}`;
}
