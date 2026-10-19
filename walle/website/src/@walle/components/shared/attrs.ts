import type { ModifierProps, VariantProps } from "./types";

/**
 * Shared target/rel rule for link-rendering components. The caller decides `external`
 * (it has `Astro.site`).
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
 * Data attributes for the variant model: `data-variant` always present (default
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

/**
 * Splits a component's own declared props from the ones passed through as {...rest}.
 * Destructuring a key missing from `keys` out of `own` is a type error.
 */
export function splitProps<T extends object, K extends keyof T>(
  props: T,
  keys: readonly K[]
): { own: Pick<T, K>; rest: Omit<T, K> } {
  const own = {} as Pick<T, K>;
  const rest = {} as Omit<T, K>;
  for (const [key, value] of Object.entries(props) as [keyof T, T[keyof T]][]) {
    if ((keys as readonly (keyof T)[]).includes(key)) {
      (own as Record<keyof T, unknown>)[key] = value;
    } else {
      (rest as Record<keyof T, unknown>)[key] = value;
    }
  }
  return { own, rest };
}
