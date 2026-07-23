# Components

All `@walle` components are MANAGED — they live in `src/@walle/components/` and are re-synced on every `walle update`. Customize through configs, CSS variables, slots, and the consumer's own component layer.

---

## API conventions

Every `@walle` component uses one shared prop vocabulary. If a component accepts one of these concepts, it uses exactly this name and type:

| Concept          | Prop                  | Type                                          | Notes                                                                                                     |
| ---------------- | --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Destination URL  | `href`                | `string`                                      | Matches HTML. A component with `href` renders a link.                                                     |
| Link target      | `target`              | `"_blank"` \| `"_self"`                       | `rel="noopener"` is added automatically when `_blank`.                                                    |
| Visual variant   | `variant`             | union per component                           | Never `color` or `type` for visual style.                                                                 |
| Size             | `size`                | `"small"` \| `"medium"` \| `"large"`          |                                                                                                            |
| Image            | `image`               | `{ src: ImageMetadata \| string; alt: string }` | `alt` is required; empty string only for decorative images.                                              |
| Label text       | `text`                | `string`                                      | Label-only components (Button, Badge). Rich content uses slots.                                            |
| Icon             | `icon` / `iconPosition` | `string` / `"start"` \| `"end"`             |                                                                                                            |
| Extra classes    | `class`               | `string`                                      | Appended to the component root element.                                                                    |
| Native button type | `type`              | `"button"` \| `"submit"` \| `"reset"`         | Only on Button; freed by the `variant` rename.                                                             |
| Element id       | `id`                  | `string`                                      |                                                                                                            |

Rules:

- **English only**: source, comments, docs, and every user-facing or screen-reader-announced string ships an English default, overridable via props or `config.app` for localization.
- Boolean modifiers are positive and unprefixed: `outline`, `centered`, `reversed`, `fullWidth`, `disabled`.
- Polymorphic components (Button as `<a>` or `<button>`) decide from `href` presence — there is no `as` prop.
- Slots over content props whenever content is rich (cards, sections).
- The vocabulary applies to **component props**. Consumer config files (`navbar.json`, `footer.json`) keep their own schema (`url`, `name`, …) — they are a stable consumer-facing contract, not component APIs.

---

## Config files

Four JSON files in `src/configs/`, all schema-validated (`just validate-configs`):

| File          | Controls                                        |
| ------------- | ----------------------------------------------- |
| `app.json`    | Site metadata, SSR, component variant selection |
| `navbar.json` | Logo and navigation links (max 2 levels)        |
| `footer.json` | Footer links and content                        |
| `theme.json`  | Design tokens → CSS vars (optional)             |

---

## Component variants

Some components ship multiple visual variants. The active variant is selected per-component in `src/configs/app.json` under the `components` key:

```json
{
  "components": {
    "navbar": "standard",
    "footer": "minimal"
  }
}
```

An absent key defaults to `standard`. An unknown variant name fails the build with an explicit error listing the available values.

### Available variants

| Component | Variants              |
| --------- | --------------------- |
| `navbar`  | `standard`, `minimal` |
| `footer`  | `standard`, `minimal` |

**`standard`** — the full-featured default (logo, navigation items, dropdowns for navbar; full link columns for footer).

**`minimal`** — stripped-down layout suitable for landing pages or apps where nav chrome would be distracting.

---

## How variant selection works

Each component with variants has a **resolver** (`*Resolver.astro`) that reads `config.app.components` at build time and renders the correct variant file:

```
src/@walle/components/features/
  Navbar/
    Navbar.astro             ← standard variant
    Navbar.minimal.astro     ← minimal variant
    NavbarResolver.astro     ← reads config, renders the selected variant
  Footer.astro               ← standard variant
  Footer.minimal.astro       ← minimal variant
  FooterResolver.astro       ← reads config, renders the selected variant
```

`BaseLayout` imports the resolver, not the concrete component. The consumer never needs to change the layout import.

---

## Adding a new variant

Variants are added in the walle source, not in consumers. If you are working on the walle design system itself:

1. Create `Component.<variant>.astro` next to the standard implementation.
2. Register the variant in `AVAILABLE_VARIANTS` in `src/@walle/define-config.ts`.
3. Add the variant to the component's resolver (`*Resolver.astro`).

The resolver picks up the selection from `config.app.components`. The e2e scenario `11_component_variants.sh` covers both the valid and invalid variant cases.

---

## Overriding a component without forking

When the built-in variants don't fit, replace the component entirely from a consumer-owned file rather than editing `src/@walle/`.

**Example: replace the Navbar**

```astro
---
// src/pages/index.astro
import BaseLayout from "@walle/layouts/BaseLayout.astro";
import MyNavbar from "@components/MyNavbar.astro";
---

<BaseLayout>
  <MyNavbar slot="navbar" />
  <!-- page content -->
</BaseLayout>
```

`BaseLayout` exposes `navbar` and `footer` slots for this purpose. Anything in those slots replaces the default `@walle` component entirely.

---

## Elements

Primitive UI components. Import from `@walle/components/elements/<Name>.astro`.

### `Badge`

Inline label with optional icon and link.

| Prop           | Type                                                                                                    | Default    |
| -------------- | ------------------------------------------------------------------------------------------------------- | ---------- |
| `text`         | `string`                                                                                                | required   |
| `variant`      | `"primary"` \| `"secondary"` \| `"alternative"` \| `"gray"` \| `"success"` \| `"warning"` \| `"danger"` | `"gray"`   |
| `icon`         | `string`                                                                                                | —          |
| `iconPosition` | `"start"` \| `"end"`                                                                                    | `"end"`    |
| `href`         | `string`                                                                                                | —          |
| `target`       | `"_blank"` \| `"_self"`                                                                                 | —          |
| `size`         | `"small"` \| `"medium"` \| `"large"`                                                                    | `"medium"` |
| `class`        | `string`                                                                                                | —          |

### `Link`

Styled `<a>` with external-link detection: absolute URLs pointing at another host get `rel="noopener noreferrer"`, `target="_blank"` and an external icon (disable with `externalIcon={false}`).

| Prop           | Type                                      | Default                                  |
| -------------- | ----------------------------------------- | ---------------------------------------- |
| `href`         | `string`                                  | required                                 |
| `text`         | `string` (slot fallback)                  | —                                        |
| `variant`      | `"default"` \| `"muted"` \| `"unstyled"`  | `"default"`                              |
| `target`       | `"_blank"` \| `"_self"`                   | `_blank` if external, `_self` otherwise  |
| `externalIcon` | `boolean`                                 | `true`                                   |
| `class`, `id`  | `string`                                  | —                                        |

### `Image`

Wrapper over `astro:assets`. An `ImageMetadata` import renders optimized with responsive `srcset`; a remote URL string renders a plain `<img>` and **requires `width`/`height`** (CLS prevention). `alt` is required (empty string only for decorative images).

| Prop            | Type                                              | Default    |
| --------------- | ------------------------------------------------- | ---------- |
| `image`         | `{ src: ImageMetadata \| string; alt: string }`   | required   |
| `width`/`height`| `number`                                          | required for remote src |
| `loading`       | `"lazy"` \| `"eager"`                             | `"lazy"`   |
| `ratio`         | `string` (CSS aspect-ratio)                       | —          |
| `sizes`/`widths`| passthrough to astro:assets                       | —          |
| `class`, `id`   | `string`                                          | —          |

### `Price`

Locale-aware price via `Intl.NumberFormat` (locale defaults to the site language from config). `compareAt` renders struck-through with accessible original/discounted labels (English defaults, overridable).

| Prop     | Type                                                    | Default            |
| -------- | ------------------------------------------------------- | ------------------ |
| `price`  | `{ amount: number; currency: string; compareAt?: number }` | required        |
| `locale` | `string` (BCP 47)                                       | site language      |
| `size`   | `"small"` \| `"medium"` \| `"large"`                    | `"medium"`         |
| `class`  | `string`                                                | —                  |

### `Button`

Renders an `<a>` styled as a button when `href` is set, a `<button>` otherwise.

| Prop        | Type                                      | Default     |
| ----------- | ----------------------------------------- | ----------- |
| `text`      | `string`                                  | required    |
| `href`      | `string`                                  | —           |
| `variant`   | `"primary"` \| `"secondary"` \| `"white"` | `"primary"` |
| `outline`   | `boolean`                                 | `false`     |
| `size`      | `"small"` \| `"medium"` \| `"large"`      | `"medium"`  |
| `fullWidth` | `boolean`                                 | `false`     |
| `icon`      | `string`                                  | —           |
| `target`    | `"_blank"` \| `"_self"`                   | —           |
| `disabled`  | `boolean`                                 | `false`     |
| `effects`   | `boolean`                                 | `true`      |
| `type`      | `"button"` \| `"submit"` \| `"reset"`     | `"button"`  |
| `id`        | `string`                                  | —           |
| `class`     | `string`                                  | —           |

---

## Features

Higher-level components. Import from `@walle/components/features/<Name>.astro` or from the barrel `@walle/components` via `index.js`.

`Navbar` and `Footer` are exposed as their resolvers — import `Navbar` from `@walle/components` and you get variant selection automatically.

### `Navbar` / `Footer`

See [Variant selection](#component-variants) above. Both read their config from the consumer's `src/configs/navbar.json` and `src/configs/footer.json`; accept an explicit `config` prop to override.

`Navbar` slots: `brand` (replaces the logo area), `actions` (appended at the end of the nav, for CTA buttons).

### `Head`

Renders all `<head>` meta tags. Used inside layouts — not imported directly in pages.

| Prop          | Type     | Default               |
| ------------- | -------- | --------------------- |
| `title`       | `string` | required              |
| `description` | `string` | from config           |
| `image`       | `string` | from config           |
| `ogImage`     | `string` | falls back to `image` |
| `robots`      | `string` | from config           |
| `favicon`     | `string` | from config           |

### `Section`

Content section wrapper.

| Prop       | Type                                        | Default |
| ---------- | ------------------------------------------- | ------- |
| `title`    | `string`                                    | —       |
| `image`    | `{ src: ImageMetadata \| string; alt: string }` | —   |
| `reversed` | `boolean`                                   | `false` |
| `centered` | `boolean`                                   | `false` |
| `variant`  | `"primary"` \| `"gray"` \| `null`           | `null`  |

### `SectionFlow`

Animated step list with scroll-triggered reveal.

| Prop       | Type                              | Default           |
| ---------- | --------------------------------- | ----------------- |
| `title`    | `string`                          | required          |
| `steps`    | `FlowStep[]`                      | required          |
| `centered` | `boolean`                         | `true`            |
| `variant`  | `"primary"` \| `"gray"` \| `null` | `null`            |
| `label`    | `string` (a11y label of the list) | `"Process steps"` |

```typescript
interface FlowStep {
  number: number;
  title: string;
  description: string;
  icon?: string;
}
```

### `SectionHeaderStandard`

Full-width page header with optional image and 3D tilt on hover.

| Prop         | Type                                      | Default     |
| ------------ | ----------------------------------------- | ----------- |
| `title`      | `string`                                  | required    |
| `subtitle`   | `string`                                  | —           |
| `image`      | `{ src: ImageMetadata; alt: string }`     | —           |
| `imageRight` | `boolean`                                 | `false`     |
| `variant`    | `"primary"` \| `"secondary"` \| `"white"` | `"primary"` |
| `centered`   | `boolean`                                 | `true`      |
| `effect`     | `boolean`                                 | `false`     |

### `CollectionFilters`

Config-driven client-side filtering (text search + multi-select facets) over any rendered collection. Items carry `data-filter-item` plus one `data-<key>` attribute per facet (comma-separated values) and optional `data-search`; the component hides non-matching items and announces the visible count in a live region. With JavaScript disabled the filter UI stays hidden and every item remains visible. Replaces the former `BlogFilters` (used internally by `BlogPostsLayout`).

| Prop           | Type                                                | Default                |
| -------------- | --------------------------------------------------- | ---------------------- |
| `facets`       | `{ key: string; label: string; options: string[] }[]` | `[]`                 |
| `itemSelector` | `string`                                            | `"[data-filter-item]"` |
| `search`       | `boolean`                                           | `true`                 |
| `labels`       | object — English defaults, override for localization | —                     |
| `class`        | `string`                                            | —                      |

### Blog components

| Component               | Purpose                     |
| ----------------------- | --------------------------- |
| `BlogArticleNavigation` | Previous/next article links |
| `BlogReadingProgress`   | Scroll progress bar         |
| `BlogTableOfContents`   | Sticky TOC from headings    |

### `Carousel`

Native CSS scroll-snap carousel — no library, no autoplay, no infinite loop. Swipe is native scrolling; prev/next buttons and slide position labels are the only JavaScript. Slides go in the default slot; each gets `role="group"` and an "i of N" label (template overridable via `slideLabel`). Reduced motion disables smooth scrolling.

| Prop                            | Type                     | Default            |
| ------------------------------- | ------------------------ | ------------------ |
| `label`                         | `string` (a11y, required)| required           |
| `perView`                       | `1` \| `2` \| `3` \| `4` | `1` (always 1 on mobile) |
| `controls`                      | `boolean`                | `true`             |
| `previousLabel` / `nextLabel`   | `string`                 | English defaults   |
| `slideLabel`                    | `string` template        | `"{i} of {n}"`     |
| `class`, `id`                   | `string`                 | —                  |

### `ProductCard`

Renders a `ProductData` object (name, description, `image`, `price` with optional `compareAt`, `availability`, `badge`, `href`) — the same shape feeds Product JSON-LD. Availability is communicated as text, never color alone. **Card boundary: has a price → `ProductCard`; no price → `BasicCard`.**

| Prop                 | Type                          | Default          |
| -------------------- | ----------------------------- | ---------------- |
| `product`            | `ProductData`                 | required         |
| `availabilityLabels` | `{ out_of_stock?, preorder? }`| English defaults |
| `class`              | `string`                      | —                |

### `SectionColumns`

CSS-grid column section: `columns` caps the count on wide screens, `auto-fit`/`minmax` collapses to one column on narrow viewports — no JavaScript, no breakpoint props. Content goes in the default slot.

| Prop             | Type                              | Default   |
| ---------------- | --------------------------------- | --------- |
| `title`          | `string`                          | —         |
| `columns`        | `2` \| `3` \| `4`                 | `3`       |
| `minColumnWidth` | `string` (CSS length)             | `"16rem"` |
| `centered`       | `boolean`                         | `false`   |
| `variant`        | `"primary"` \| `"gray"` \| `null` | `null`    |
| `class`          | `string`                          | —         |

### Other features

| Component     | Purpose                                     |
| ------------- | ------------------------------------------- |
| `Analytics`   | Injects analytics script in production only |
| `Breadcrumbs` | Structured breadcrumb trail                 |
| `BasicCard`   | General-purpose content card (no price)     |

---

## Layouts

Import from `@walle/layouts/<Name>.astro`.

### `AbstractLayout`

Base HTML wrapper. Loads `Head`, `global.css`, and `Analytics`. Renders a skip link as the first focusable element, targeting `#main-content` (provided by `BaseLayout`).

**Props:** `headerTitle`, `headerDescription`, `headerImage`, `headerOgImage`, `headerRobots`, `headerLanguage`, `skipLinkLabel` (default `"Skip to content"`)

**Slots:** `head` (injected inside `<head>` after `<Head />`), default (body content)

### `BaseLayout`

Extends `AbstractLayout`. Adds `<Navbar>` and `<Footer>`. Inherits all `AbstractLayout` props.

**Slots:** `head` (forwarded to `AbstractLayout`), `navbar` (replaces default `<Navbar>`), `footer` (replaces default `<Footer>`), default (page content inside `<main>`)

### `DetailLayout`

Generic detail page: `SectionHeaderStandard` (title + `badges` slot) over a responsive two-column grid — default slot as main column, `aside` slot as sidebar — with optional `backLink` and `breadcrumbs`. Composes with `ProductData` content for product detail pages.

**Props:** `title` (required), `description`, `ogImage`, `breadcrumbs` (`BreadcrumbItem[]`), `backLink` (`{ href, label? }`, label defaults to `"Back"`), `headerEffect`

**Slots:** `badges`, default (main), `aside`

### `BlogPostLayout`

Single blog post. Accepts post frontmatter via props and renders title, date, reading time.

### `BlogPostsLayout`

Blog listing page. Accepts `title`, `description`, `posts[]`.
