# Components

All `@walle` components are MANAGED — they live in `src/@walle/components/` and are re-synced on every `walle update`. Customize through configs, CSS variables, slots, and the consumer's own component layer.

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
| `color`        | `"primary"` \| `"secondary"` \| `"alternative"` \| `"gray"` \| `"success"` \| `"warning"` \| `"danger"` | `"gray"`   |
| `iconName`     | `string`                                                                                                | —          |
| `iconPosition` | `"start"` \| `"end"`                                                                                    | `"end"`    |
| `link`         | `string`                                                                                                | —          |
| `target`       | `string`                                                                                                | —          |
| `size`         | `"small"` \| `"medium"` \| `"large"`                                                                    | `"medium"` |
| `extraClass`   | `string`                                                                                                | —          |

### `Button`

Button or link-wrapped button.

| Prop             | Type                                      | Default     |
| ---------------- | ----------------------------------------- | ----------- |
| `text`           | `string`                                  | required    |
| `link`           | `string`                                  | —           |
| `type`           | `"primary"` \| `"secondary"` \| `"white"` | `"primary"` |
| `outline`        | `boolean`                                 | `false`     |
| `size`           | `"small"` \| `"medium"` \| `"large"`      | `"medium"`  |
| `fullWidth`      | `boolean`                                 | `false`     |
| `iconName`       | `string`                                  | —           |
| `target`         | `string`                                  | —           |
| `disabled`       | `boolean`                                 | `false`     |
| `disableEffects` | `boolean`                                 | `false`     |
| `buttonType`     | `"button"` \| `"submit"` \| `"reset"`     | `"button"`  |
| `id`             | `string`                                  | —           |
| `extraClass`     | `string`                                  | —           |

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

| Prop       | Type                              | Default |
| ---------- | --------------------------------- | ------- |
| `title`    | `string`                          | —       |
| `centered` | `boolean`                         | `true`  |
| `type`     | `"primary"` \| `"gray"` \| `null` | `null`  |

### `SectionFlow`

Animated step list with scroll-triggered reveal.

| Prop       | Type                              | Default  |
| ---------- | --------------------------------- | -------- |
| `title`    | `string`                          | required |
| `steps`    | `FlowStep[]`                      | required |
| `centered` | `boolean`                         | `true`   |
| `type`     | `"primary"` \| `"gray"` \| `null` | `null`   |

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
| `imageSrc`   | `ImageMetadata`                           | —           |
| `imageAlt`   | `string`                                  | `""`        |
| `imageRight` | `boolean`                                 | `false`     |
| `variant`    | `"primary"` \| `"secondary"` \| `"white"` | `"primary"` |
| `centered`   | `boolean`                                 | `true`      |
| `effect`     | `boolean`                                 | `false`     |

### Blog components

| Component               | Purpose                     |
| ----------------------- | --------------------------- |
| `BlogArticleNavigation` | Previous/next article links |
| `BlogFilters`           | Tag/category filter UI      |
| `BlogReadingProgress`   | Scroll progress bar         |
| `BlogTableOfContents`   | Sticky TOC from headings    |

### Other features

| Component     | Purpose                                     |
| ------------- | ------------------------------------------- |
| `Analytics`   | Injects analytics script in production only |
| `Breadcrumbs` | Structured breadcrumb trail                 |
| `BasicCard`   | General-purpose content card                |

---

## Layouts

Import from `@walle/layouts/<Name>.astro`.

### `AbstractLayout`

Base HTML wrapper. Loads `Head`, `global.css`, and `Analytics`.

**Props:** `headerTitle`, `headerDescription`, `headerImage`, `headerOgImage`, `headerRobots`, `headerLanguage`

**Slots:** `head` (injected inside `<head>` after `<Head />`), default (body content)

### `BaseLayout`

Extends `AbstractLayout`. Adds `<Navbar>` and `<Footer>`. Inherits all `AbstractLayout` props.

**Slots:** `head` (forwarded to `AbstractLayout`), `navbar` (replaces default `<Navbar>`), `footer` (replaces default `<Footer>`), default (page content inside `<main>`)

### `BlogPostLayout`

Single blog post. Accepts post frontmatter via props and renders title, date, reading time.

### `BlogPostsLayout`

Blog listing page. Accepts `title`, `description`, `posts[]`.
