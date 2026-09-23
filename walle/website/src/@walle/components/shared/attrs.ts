import type { ModifierProps, VariantProps } from "./types";

/**
 * One rel rule for link-rendering components (absorbs Link.astro's inline logic, D5).
 * The caller resolves "is this host external" (it has `Astro.site`, this function doesn't)
 * and passes the result in.
 */
export function linkAttrs({
  target,
  external = false,
}: {
  target?: "_blank" | "_self";
  external?: boolean;
}): { target: "_blank" | "_self"; rel: string | undefined } {
  const resolvedTarget = target ?? (external ? "_blank" : "_self");
  const rel = external
    ? "noopener noreferrer"
    : resolvedTarget === "_blank"
      ? "noopener"
      : undefined;
  return { target: resolvedTarget, rel };
}

/**
 * Data attributes for the variant model (D4): `data-variant` always present (default
 * "primary"), each modifier attribute present only when its prop is `true`.
 */
export function variantAttrs(
  props: VariantProps & ModifierProps
): Record<string, string | undefined> {
  const { variant = "primary", outline, filled, muted, inverse } = props;
  return {
    "data-variant": variant,
    "data-outline": outline ? "true" : undefined,
    "data-filled": filled ? "true" : undefined,
    "data-muted": muted ? "true" : undefined,
    "data-inverse": inverse ? "true" : undefined,
  };
}

/** Separates a component's own declared props from everything meant to pass through as {...rest}. */
export function splitProps<T extends Record<string, unknown>>(
  props: T,
  keys: string[]
): { own: Record<string, unknown>; rest: Record<string, unknown> } {
  const own: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (keys.includes(key)) own[key] = value;
    else rest[key] = value;
  }
  return { own, rest };
}
