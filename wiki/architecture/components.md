# Component authoring template

This page is a draft: it lives ahead of the wiki restructure (task 19.1, which switches the
loader to nested `**/*.md` pages under `Architecture`). Until then it isn't linked from the
site — read it directly from the repo. It documents the template every `@walle` component
follows from group 5 onward: shared props, prop order, style block order, and the public vs
internal custom property convention.

---

## Shared building blocks

Every component pulls from `src/@walle/components/shared/`:

- `types.ts` — `BaseProps` (`id?`, `class?`, plus native attribute passthrough), `Variant`
  (the fixed set: `primary` \| `secondary` \| `alternative` \| `site`), `VariantProps`
  (`variant?`), `ModifierProps` (`outline?`, `filled?`, `muted?`, `inverse?`), `Size`.
- `attrs.ts` — `linkAttrs(href, target)` (one `rel` rule, so it's computed once instead of
  duplicated per link-rendering component), `variantAttrs(props)` (data attributes, default
  `primary`), `splitProps(props, keys)` (separates a component's own props from passthrough).

A component only declares the props it actually adds on top of these; it never redefines
`variant`, `outline`, `id`, or `class` itself.

---

## Prop order

1. `BaseProps` fields (`id`, `class`, passthrough).
2. `VariantProps` (`variant`).
3. `ModifierProps` (`outline`, `filled`, `muted`, `inverse` — only the ones the component
   actually supports).
4. The component's own props.

## Style block order

1. Public properties (the component's own `--<prefix>-*` custom properties, with their
   defaults).
2. Structure (layout, box model — the parts that don't vary by variant or modifier).
3. Variants mapping (`.button { --button-bg: var(--variant-bg); }` — mapping shared
   `--variant-*` tokens onto the component's own public properties; components never read
   palette tokens like `--primary` directly).
4. Modifiers (`[data-outline]`, `[data-filled]`, `[data-muted]`, `[data-inverse]` — remapping
   which variant tokens feed the component's public properties, never the variant itself).
5. Responsive.
6. Reduced motion.

## Public vs internal custom properties

- `--<prefix>-*` (for example `--button-bg`, `--badge-radius`) is **public**: part of the
  component's contract, meant to be overridden by a consumer.
- `--_<prefix>-*` (leading underscore) is **internal**: scratch state the component's own
  style block uses between rules, never meant to be set from outside.

---

## The variant model in practice

- Every component that reads `--variant-*` emits `data-variant` on its own root (default
  `primary`), so the nearest definition is always its own — parent variants never leak in.
- Modifiers are `data-outline`, `data-filled`, `data-muted`, `data-inverse`, each emitted only
  when its prop is `true` (absent otherwise, never `"false"`). They change which variant
  tokens a component maps onto its public properties, not the variant itself.
- A site brands `site` once — `@layer site { [data-variant="site"] { --variant-bg: ...; } }`
  — and can still tune one component without forking it:
  `@layer site { .button[data-variant="site"] { --button-radius: 0; } }`.

---

## Root attributes

Every visual component root receives `{...rest}` (the passthrough half of `splitProps`)
spread after its own attributes, so a consumer's `data-*`, `aria-*`, or event handler always
wins over the component's own defaults.
