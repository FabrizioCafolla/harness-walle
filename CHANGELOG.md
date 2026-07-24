# Changelog

All notable changes to Walle are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); this project adheres to
[Semantic Versioning](wiki/versioning.md).

## [0.3.0] — 2026-07-23

### Added

- **New base components**, all following the shared prop vocabulary, each with full Astrobook
  story coverage and passing the axe + 320px-reflow gates:
  - `elements/Link` — styled anchor with external-link detection (`rel="noopener noreferrer"`,
    external icon, `target` defaulting to `_blank` for other hosts).
  - `elements/Image` — `astro:assets` wrapper; remote URL sources render a plain `<img>` and
    require explicit `width`/`height` (CLS prevention); `alt` is required.
  - `elements/Price` — locale-aware `Intl.NumberFormat` price with accessible struck-through
    `compareAt` rendering.
  - `features/Carousel` — native CSS scroll-snap, prev/next controls, per-slide "i of N"
    labels, reduced-motion aware. No library, no autoplay, no infinite loop.
  - `features/Card/ProductCard` — renders a `ProductData` shape (schema.org-aligned: price,
    availability, badge) for headless-ecommerce data. Card boundary: has a price →
    `ProductCard`; no price → `BasicCard`.
  - `features/Sections/SectionColumns` — CSS-only responsive column grid (2–4 columns,
    collapses to one on narrow viewports).
- **320px reflow gate** (WCAG 1.4.10) in the Playwright a11y suite: every story page and demo
  page must render without page-level horizontal overflow at 320px.
- **`features/CollectionFilters`** — config-driven client-side filtering (search + multi-select
  facets over `data-*` attributes, live result count, progressive enhancement). **Replaces
  `BlogFilters`** (which was only used internally by `BlogPostsLayout`); generalises the
  filter pattern duplicated by consumer sites.
- **`layouts/DetailLayout`** — generic detail page (header with badges slot, back link,
  breadcrumbs, responsive main/aside grid), generalised from europeopensource.eu's
  `ProjectDetailLayout`; composes into product detail pages (see the seeded
  `/products/example` demo page).
- **SEO / AI structured data.** `features/StructuredData` renders schema.org JSON-LD from plain
  objects (builders in `@walle/utils/structured-data`); layouts wire it automatically:
  `AbstractLayout` → `WebSite` + `Organization` from config, `BlogPostLayout` → `Article`,
  `DetailLayout` → `Product`/`Offer` from the same `ProductData` that feeds the visible page.
- **`/llms.txt`** ([llmstxt.org](https://llmstxt.org)) — build-time markdown index of the site
  (identity + page tree + blog posts with descriptions), seeded as `src/pages/llms.txt.ts`.
- **`Head` metadata**: `og:locale` from the site language, `article:published_time` (and
  `og:type: article`) when the layout provides a publish date.

### Changed

- **BREAKING — unified component prop vocabulary.** Every `@walle` component now uses the shared
  API convention documented in [wiki/components.md](wiki/components.md#api-conventions). Consumer
  usages of `@walle` components need the following mechanical renames (find/replace):

  | Component     | Old prop                | New prop                        |
  | ------------- | ----------------------- | ------------------------------- |
  | `Button`      | `link`                  | `href`                          |
  | `Button`      | `type` (visual style)   | `variant`                       |
  | `Button`      | `buttonType`            | `type`                          |
  | `Button`      | `iconName`              | `icon`                          |
  | `Button`      | `disableEffects={true}` | `effects={false}`               |
  | `Button`      | `extraClass`            | `class`                         |
  | `Badge`       | `color`                 | `variant`                       |
  | `Badge`       | `link`                  | `href`                          |
  | `Badge`       | `iconName`              | `icon`                          |
  | `Badge`       | `extraClass`            | `class`                         |
  | `BasicCard`   | `linkUrl`               | `href`                          |
  | `BasicCard`   | `linkTarget`            | `target`                        |
  | `BasicCard`   | `imageUrl` + `imageAlt` | `image={{ src, alt }}`          |
  | `BasicCard`   | `badge.color`           | `badge.variant`                 |
  | `BasicCard`   | `extraClass`            | `class`                         |
  | `HeaderStandard` | `imageSrc` + `imageAlt` | `image={{ src, alt }}`       |
  | `Section`     | `type`                  | `variant`                       |
  | `Section`     | `imageSrc` + `imageAlt` | `image={{ src, alt }}`          |
  | `SectionFlow` | `type`                  | `variant`                       |
  | `Breadcrumbs` | `items[].url`           | `items[].href`                  |
  | `Breadcrumbs` | `items[].iconName`      | `items[].icon`                  |
  | `Breadcrumbs` | `extraClass`            | `class`                         |

  Consumer config files (`navbar.json`, `footer.json`) are **not** affected.
- **`BlogFilters` removed** — superseded by `CollectionFilters` (no consumer imported it
  directly; `BlogPostsLayout` migrated internally).
- **`Button` no longer nests `<button>` inside `<a>`** (invalid HTML, nested interactive
  elements). With `href` it renders a single `<a>` styled as a button; otherwise a `<button>`.
- **`rel="noopener"` is added automatically** on every `@walle` link with `target="_blank"`.
- Updated all website dependencies to latest (astro 7.1.3, eslint 10.7, eslint-plugin-astro 3,
  vitest 4, playwright 1.61); yarn 4.17.1. TypeScript stays on 6.0.3 until typescript-eslint
  supports TS 7.
- **Semantic design tokens.** `global.css` now exposes `--surface`, `--surface-alt`, `--text`,
  `--text-muted`, `--border`, `--link`, `--link-hover`, `--focus-ring`, `--disabled-opacity` on
  top of the palette; `@walle` components reference these for neutral surfaces/text/borders/focus.
  Override the semantic block to restyle every component at once.
- **WCAG 2.2 AA contrast fixes to default colors** (lightness only, hue unchanged; enforced by
  `tests/unit/contrast.test.ts`):
  - `--gray-dark` `#6b7280` → `#636a76` (muted text was 4.43:1 on gray sections and 4.1:1 on
    the Footer's gray background; the new value passes AA on all three gray surfaces)
  - Badge `success` `#2ecc71` → `#1f874b`, `warning` `#f39c12` → `#a36708`,
    `danger` `#e74c3c` → `#da2d1b` (white badge text was 2.1–3.9:1)

- **WCAG 2.2 AA accessibility baseline.** Skip link in `AbstractLayout` (label overridable via
  `skipLinkLabel`), global `prefers-reduced-motion` kill-switch, Navbar Esc-to-close returns
  focus to the trigger and dropdowns expose `aria-expanded`, `aria-current="page"` on
  breadcrumbs. Enforced in CI by an axe-core Playwright suite (`just a11y-test`) covering every
  Astrobook story page plus the demo-site pages — fails on serious/critical violations.

### Fixed

- `global.css` used invalid `rgb(var(--gray-light))` for `code` background and `hr` border —
  the value resolved to nothing; both now use semantic tokens.
- `BlogPostsLayout` rendered a second `<main>` nested inside `BaseLayout`'s — invalid landmark
  structure; now a `<div>`.
- **Astrobook visual regression was screenshotting 404 pages.** The spec's hardcoded
  `/astrobook/<group>/<Name>` URLs never matched astrobook's real route scheme —
  `<basePath>/astrobook/stories/<module>/<story>` (the site base prefix is required: in dev the
  unprefixed form answers 200 to `Accept: */*` but 404 to a browser's `Accept: text/html`).
  Story routes are now auto-discovered from the `astrobook/` directory with the base read from
  `app.json` (shared with the a11y suite), baselines regenerated, and both suites fail loudly
  if the page is the not-found fallback.
- Footer text (`--text-muted` on the `--gray` background) was below AA contrast — covered by
  the darker `--gray-dark` default and a new pairing in `contrast.test.ts`. The license lines
  additionally applied `opacity: 0.8` on top of the muted color, dropping effective contrast
  below AA again — removed in both footer variants.
- **`StructuredData` now escapes `<`/`>`/`&`** in the JSON-LD output, so an untrusted value
  (e.g. a product name from a headless-commerce source) containing `</script>` cannot close the
  element early or inject markup. Covered by `tests/unit/structured-data.test.ts`.
- `productJsonLd` emits the `Product` image for local `ImageMetadata` sources too (was
  string-only, dropping the image for the recommended optimized-asset path).
- `Price` normalizes a POSIX-style locale (`it_IT` → `it-IT`) so an `Intl.NumberFormat`
  `RangeError` can't crash the build on a config typo.
- Blog `data-search` and `/llms.txt` guard an absent `description` (no literal `"undefined"`);
  `CollectionFilters` option ids include the index so same-slug options don't collide.
- **CI: `setup-node` yarn cache** pointed at `walle/website/yarn.lock` (the lockfile is in the
  website subdir) — without it the a11y gate and the e2e job failed at setup with "lock file is
  not found".
- **Playwright configs** hardened: the functional config runs only `navbar.test.ts` (was also
  picking up the astrobook-served a11y suite against the wrong server) and navigates to the base
  path without a trailing slash (`trailingSlash: never`) — which also closed a latent hole where
  the home demo page was axe-testing the 404 page; both webServer commands use `--force` to
  replace stale astro dev locks.
- **e2e manifest validation** resolves `ajv`/`ajv-formats` from `walle/website/node_modules`
  (declared devDependencies) instead of a repo-root network install, so the harness passes
  offline.
- **CI e2e job** installs dependencies in `walle/website` (where the `packageManager` field
  lives) instead of the repo root, where `corepack prepare --activate` had nothing to resolve.
- **Navbar dropdown** dropped its invalid `role="menu"` (which requires `role="menuitem"`
  children): a navigation dropdown is a plain `<ul>`/`<li>`/`<a>` list. Fixes the
  `aria-required-children` (critical) and `listitem` (serious) violations Lighthouse flagged.
- **`SectionFlow` step titles are `<h3>`** (were `<h5>`, skipping heading levels after the
  section's `<h2>`) with their compact size preserved — fixes the heading-order violation.

## [0.2.1] — 2026-07-06

### Changed

- Fix and update harness-coding

## [0.2.0] — 2026-07-06

### Changed

- **Seed a fresh consumer from `walle/website/` directly; removed `walle/template/`.** One source
  of truth instead of a template that could drift. Walle's own GH-Pages `baseUrl`/`basePath` in
  `app.json` are reset to neutral defaults on seed.
- **What is managed / seed / inject is declared in `walle/walle.yml`.** The CLI reads this config
  instead of hardcoded per-module maps — add or move a path by editing the config, no code change.
- **`.walle/manifest.json` records a `files` map** grouping every written path by class → module;
  `.walle/config.yml` lists the enabled modules explicitly.

### Fixed

- **`init` now establishes the harness-coding base itself**, running its CLI first (`justfile`,
  `.devcontainer/`, git hooks) before seeding and injecting — previously it only warned, leaving a
  broken half-state. `--no-harness-coding` skips it; `WALLE_HARNESS_CODING_CLI` points at a local
  `cli.sh` for offline runs.

## [0.1.2] — 2026-07-06

### Changed

- **`ai` and `ci` modules are now default-on at `init`** (opt-out, same pattern as
  `harness-coding`), instead of opt-in. Use `--no-ai` / `--no-ci` to skip them.
  `backend` and `infrastructure` remain opt-in.

### Fixed

- Removed `walle/website/AGENTS.md` — a stray, unreferenced duplicate left over from before
  the repo restructured `website/` under `walle/`.
- Moved the AGENTS block source (`agents.block.md`) from `walle/cli/` to `walle/ai/`, matching
  the convention that each module owns its template content.
- Aligned `walle/template/package.json`'s Astro dependency versions (`astro`, `@astrojs/mdx`,
  `@astrojs/node`, `@astrojs/rss`) with `walle/website/package.json` — the consumer scaffold
  was pinning Astro 6 while the `@walle` components it ships (from `website/`) are built and
  tested against Astro 7.

## [0.1.1] — 2026-07-06

### Fixed

- **`harness-coding` module** — the reduced-form warning (no `.devcontainer/` at `init`) now
  names the exact harness-coding bootstrap command to run, instead of a generic message.

## [0.1.0] — 2026-07-06

First release.

### Added

- **`website`** module — Astro design system source (`@walle/` components, layouts, styles),
  scaffolded via `cli.sh init` and kept current with `cli.sh update`.
- **`ci`** module — GitHub Actions workflows for tests and deploy.
- **`backend`** module — starter API routes (health check, echo) and middleware for SSR projects.
- **`infrastructure`** module — Terraform/OpenTofu starter scaffold.
- **`ai`** module — AGENTS.md block and Claude Code skills for the consumer project.
- **`harness-coding`** module — devcontainer integration (opt-out at `init`).
- CLI (`cli.sh`): `init`, `update`, `add <module>`, `check` — manifest-driven (`.walle/manifest.json`,
  schema v2), with `--dry-run` support throughout.
