# Changelog

All notable changes to Walle are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); this project adheres to
[Semantic Versioning](wiki/versioning.md).

## [Unreleased]

### Added

- **Optional PWA layer.** `pwa.enabled` in `app.json` turns on a web app manifest, a Workbox
  service worker and its registration; every other manifest field falls back to what the site
  already declares (title, description, language, theme palette, base path). Astro-side knobs are
  overridden natively via `defineWalleConfig({ pwa: … })`, and `runtimeCaching` merges instead of
  replacing (consumer rules first). Off by default: no integration mounted, nothing added to any
  page. See [wiki/pwa.md](wiki/pwa.md). This replaces the pattern of hand-patching manifest links
  and a registration script into `Head.astro`, a MANAGED file, where the next `update` wiped them
  without `check` noticing.

### Changed

- **A page now ships only the CSS of the components it can actually use.** Astro collects a page's
  CSS from its module graph rather than from what renders, so the component barrels put every
  component's `<style>` on every page. The barrels are now rewritten at build time down to the
  exports a project imports, walle's own files import each other directly, the cart is imported
  only in commerce mode, and the navbar/footer resolvers load only the selected variant. Measured
  on a consumer site: shared stylesheet 79.4 kB → 40.5 kB, with no CSS left for components no page
  renders.
- **The service worker registration no longer sits on the critical path.** The generated
  `registerSW.js` registers inside its own `load` listener, so `workbox-window` never enters the
  page bundle.

### Fixed

- **Forced reflow on every page load.** The navbar read `window.scrollY` inside its
  `DOMContentLoaded` handler, forcing a synchronous layout before the browser's own; it now runs
  one frame later, with the same result on a restored scroll position.
- **Layout thrashing in the scrollable-region a11y pass.** It now returns before touching geometry
  when a page has no `pre`, `table` or `[data-scrollable]`, and separates its reads from its
  writes instead of interleaving them per element.

## [0.3.2] — 2026-08-18

### Fixed

- **`BaseLayout`'s optional "Docs" nav-link check no longer spams `console.warn` on every
  request.** `getCollection("wiki")` doesn't throw when the collection is missing or empty (Astro
  only registers a collection in its content store once the loader writes at least one entry), so
  the existing `try/catch` never actually fired — Astro logged via `console.warn` and returned
  `[]` instead. Every consumer without a wiki collection (i.e. every seeded site) hit this on
  every single page load, in both `dev` and `build`. `console.warn` is now suppressed for the
  duration of that one lookup only.

## [0.3.1] — 2026-07-27

### Changed

- **Product detail page follows the standard e-commerce PDP layout.** `DetailLayout` gained a
  full-width `below` slot; the product page now puts the **gallery** in the main column, the **buy
  box** (title, price, variants, add-to-cart) in the aside, and the **description + recommendations**
  full-width below. Fixes the mobile bug where the add-to-cart stacked at the very bottom (after the
  description and upsell) — on mobile it now sits **right after the images**: gallery → buy box →
  description → recommendations. Description prose is capped to a readable measure (~70ch).
- **`ProductBuyCard`: removed the redundant "View details" cue and its `showDetailsLink` prop** — the
  whole card is already a stretched link to the detail page. Buy controls now anchor to the card
  bottom so price/add-to-cart line up across a grid.
- **Mobile commerce UX** (studied against Nike/Apple/Shopify PDPs):
  - Navbar on mobile now places the **cart trigger immediately left of the hamburger** (both on the
    right). The hamburger was moved to the end of the DOM so the reading/focus order matches the
    visual order (`brand · cart · hamburger`) — no CSS `order`, so keyboard tab order stays correct.
  - Product detail page gained a **Nike-style sticky add-to-cart bar** on mobile: a single full-width
    **Add to cart** button that appears while the buy box is off-screen and, when tapped, scrolls to
    the buy box (which takes focus, `tabindex="-1"`) so the shopper picks size/colour. Progressive
    enhancement (an anchor to `#buy-box`); no JS ⇒ it stays hidden.
  - Removed the redundant **"Back to products"** back-link from the product detail page — the
    breadcrumbs already provide that navigation.
  - New **`commerce.showAddToCartOnCards`** config (default `true`) to toggle the add-to-cart button on
    listing cards independently of the detail page.
- **`Carousel` no longer inherits the global `section { padding: 4rem 1.5rem }`** (it resets its own
  padding). That stray top padding was pushing the product gallery ~64px below the buy box on desktop —
  the slides and the buy box now top-align.
- **Consumer state folder renamed `.walle/` → `.harness-walle/`**, and the manifest `files` map is
  now grouped **by module** (`schemaVersion: 3`): `{ managed: { website: [paths…], … }, seed: {…},
inject: {…} }` instead of the v2 `{ managed: { path: module, … } }`. Both changes are cosmetic to
  the sync engine (the `files` map is informational — nothing reads it to prune), so **migration is
  automatic and idempotent**: any CLI command (`update`/`add`/`check`) renames the folder (or a legacy
  root `.walle.config.json`), reshapes a v2 `files` map to v3, and bumps `schemaVersion`. No consumer
  action needed. Schema (`walle.config.schema.json`), the CLI, wiki, and e2e (`04`, `07`, `14`, `16`)
  updated together; base + extended suites green.
- **`walle deps --apply` no longer silently leaves a build broken.** A missing runtime `dependency`
  from the seed is now added by `--apply` (and flagged by `check`), because synced `@walle` code
  hard-imports it; missing `devDependencies` (optional tooling) stay opt-out. Fixes 0.3.0 consumer
  builds failing on `@nanostores/persistent` (see below).

### Removed

- **`infrastructure` module** — the Terraform/OpenTofu starter scaffold is out of scope and has been
  removed: its seed files (`walle/infrastructure/`), the `walle.yml` seed entries, the CLI
  `validate_module` entry and enum in `walle.config.schema.json`, the extended e2e scenario, and all
  wiki/README/AGENTS references. `cli.sh add infrastructure` (and `infrastructure` in a manifest) now
  errors as an unknown module. No consumer used it, so `update` is unaffected. The devcontainer's
  optional Terraform tool check (harness-coding) is separate and untouched.

### Added

- **Wiki rendered into the showcase site** at `/wiki` (index + `/wiki/<page>`), built from the repo
  `wiki/*.md` at build time and **shipped by the Pages deploy** (the deploy checks out the whole repo
  and builds `walle/website`, where `../../wiki` resolves). Readable layout: a sidebar index, prose
  capped to a comfortable measure, wide tables/code that scroll, and — so the docs are actually
  navigable — the inter-doc markdown links are rewritten to real routes (`modules.md` → `/wiki/modules`,
  `../CHANGELOG.md` → the file on GitHub). The route is `website-seed-exclude`d and its content
  collection is existence-gated, so a consumer (which has no `wiki/` folder) never ships the UI and its
  build is unaffected. `BaseLayout` adds a **"Docs" navbar link only when the `wiki` collection has
  pages** (so the showcase gets it site-wide; a seeded consumer, whose collection is empty, does not —
  and a consumer that removed the collection is handled defensively). axe-checked (`/wiki`, `/wiki/cli`
  added to the a11y suite).
- **`just walle-deps` recipe** (injected into the consumer `justfile.project`), so dependency drift is
  reviewed and applied the same `just`-first way as everything else: `just walle-deps` /
  `just walle-deps --apply`.
- **README "For AI agents" section** — the missing entry point for an agent scaffolding a _new_
  project: the `init` bootstrap, the modules, and the `walle-customize` / `walle-update` skills it
  then drives, all through `just`.

### Fixed

- **Commerce runtime deps no longer break a consumer build.** `BaseLayout` statically imports
  `CartMount` (the `showCart` guard is render-time only), so every consumer build — vetrina
  included — pulls `commerce/cart.ts` into the module graph and hard-requires `nanostores` /
  `@nanostores/persistent`. A consumer whose seed `package.json` predates commerce (e.g. one created
  before 0.3.0) was missing them and 0.3.0 failed at build with `Rolldown failed to resolve import
"@nanostores/persistent"`. `walle deps` now treats a **missing runtime `dependency`** as a build
  breaker: `check` flags it and `--apply` adds it (previously `--apply` only bumped deps already
  present, and `check` could even print "up to date" while a required dep was absent). Missing
  `devDependencies` (vitest, playwright, astrobook, husky) stay opt-out — reported, never forced.
  The 0.3.0 deps table below is corrected: `nanostores` / `@nanostores/persistent` are required by
  **every** consumer, not "shop mode only".

### Fixed / Docs

- **Dangling & leaky references removed.** `AGENTS.md`, `wiki/commerce.md`, and the consumer-synced
  `cart.ts` / `shopify.ts` pointed at `openspec/…/shopify-astro-headless-report.md`, a file that lives
  only in a separate private repo — a broken link that also leaked internal planning docs into an OSS
  project and into every consumer. Replaced with self-contained descriptions.
- **`AGENTS.md` corrected**: dropped the non-existent `walle/template/` reference and the stale claim
  that markdown images are handled by a rehype plugin (they use relative co-located paths +
  `astro:assets` now). Removed the same dead `walle/template/` ignore from `eslint.config.js`.
- **Skills refreshed**: `walle-update` no longer lists the removed Terraform/infra seeds and now
  documents `just walle-deps`; `walle-customize` gained the **commerce (Shopify)** customization
  section it was missing.
- **`just`-first commands** across the README, skills, and versioning guide (e.g. `just walle-update`,
  `just walle-check`, `just walle-deps`, `just yarn …`), and clearer messaging that harness-coding
  provides a ready **VS Code devcontainer** dev environment.

## [0.3.0] — 2026-07-23

### Dependencies

Walle's `package.json` is a **seed** file — created once at `init` and owned by the consumer
afterwards — so `walle update` deliberately never rewrites it (it would clobber the deps a
consumer added). That means dependency bumps do **not** propagate automatically; each release lists
its dependency changes here so a consumer can apply them with `yarn up <pkg>@<range>`. See
[wiki/versioning.md](wiki/versioning.md#keeping-dependencies-current).

Walle-owned dependencies validated for this release (bump these; leave your own deps alone):

| Dependency                                  | Range                 | Notes                                                     |
| ------------------------------------------- | --------------------- | --------------------------------------------------------- |
| `astro`                                     | `^7.1.3`              | Content Layer, `astro:assets`                             |
| `astrobook`                                 | `^0.13.2`             | dev-only component catalog                                |
| `nanostores` / `@nanostores/persistent`     | `^1.4.1` / `^1.3.5`   | commerce cart — required by every build (see 0.3.1 Fixed) |
| `vitest`                                    | `^4.1.10`             | unit runner (major bump from 3.x)                         |
| `eslint`                                    | `^10.7.0`             | with `@typescript-eslint/* ^8.65.0`                       |
| `@playwright/test` / `@axe-core/playwright` | `^1.61.1` / `^4.12.1` | a11y + visual suites                                      |

CI actions (managed, so these **do** update on `walle update`): `actions/setup-node` `v6` → `v7`.

New **`walle deps`** command closes the loop: it compares your `package.json` against the release's
seed and reports Walle-owned drift (run automatically after `update`, disable with
`--no-deps-check`); `walle deps --apply` bumps just those entries, leaving your own dependencies
untouched. See [wiki/cli.md](wiki/cli.md#deps) and
[wiki/versioning.md](wiki/versioning.md#keeping-dependencies-current).

**Fixed — CLI command dispatch:** the launcher scanned every argument for a command keyword, so a
flag value equal to a command name (e.g. `init -n deps`, or a project literally named `check`) was
mistaken for the command. It now takes the command from the first argument only and passes the rest
through verbatim.

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
- **`/robots.txt`** — config-driven endpoint (`src/pages/robots.txt.ts`): emits `Allow`/`Disallow`
  from `app.json` `website.robots` and a `Sitemap:` pointer built from the resolved site URL, so it
  stays correct per consumer. Fixes the dev-server `404 /robots.txt`.
- **Showcase page** (`/showcase`, in the navbar): a live tour of every component — buttons, badges,
  links, price, cards, responsive columns, carousel — driven by the same semantic tokens. Added to
  `/llms.txt` and the axe gate.
- **Legal pages** `/privacy-policy` and `/terms-and-conditions` (already linked from the footer):
  neutral English placeholder copy, clearly marked as templates, `noindex`. Now covered by the axe
  gate.
- **Redesigned home page**: a flat hero with a terminal snippet, a "four layers" module grid
  (Website · CI/CD · Harness coding), the how-it-works flow, quick-start, and a showcase CTA.
  Reframed around the website, GitHub Actions CI/CD and the AI-ready harness-coding base
  (infrastructure references removed).
- **Shopify headless commerce module** (`src/@walle/commerce/`, [wiki/commerce.md](wiki/commerce.md)):
  a `products` content collection sourced from the Storefront API at build time (with a bundled
  fixture fallback so the demo builds with no credentials), static `/products` listing and
  `/products/[handle]` detail pages (zoomable gallery, `descriptionHtml` body, `RELATED` upsell,
  Product/Offer JSON-LD), a vanilla variant picker, and a client-side cart (`nanostores` + Storefront
  Cart API + hosted Shopify checkout). `commerce.showBuyButton` in `app.json` toggles vetrina (catalog
  only, zero cart JS) vs shop. When commerce is on but no store is connected, an in-memory **mock
  backend** (`cart-mock.ts`) runs the full add-to-cart/drawer/checkout flow from the fixture, so the
  demo (and any consumer) is fully reviewable with zero credentials; it switches to the live Cart API
  the moment the env vars are set. No SSR. Follows the project investigation report.
- **Product image galleries**: `Carousel` gains an optional `zoom` prop — image slides open full
  screen in a native `<dialog>` lightbox. The two demo blog posts and the products use real
  placeholder photography and professional English copy with search-friendly tags.

### Changed

- **New default look: flat and editorial.** Replaced the blue + magenta + yellow palette with a
  restrained navy (`--primary #243b6b`) + muted teal (`--secondary #2f5d57`) + warm gold
  (`--alternative #c99a3f`) system, kept deep enough that white text clears AA on every brand surface
  (verified by `contrast.test.ts`). Removed the gradient fills that read as dated: buttons, the hero,
  section headers, and the blog progress bars are now solid. Tightened the `--radius-*` scale to a
  crisp 2/4/6/8px and retired pill shapes on badges, nav chrome and tag chips. Consumers with a
  `theme.json` palette/radii override are unaffected.
- **`HeaderStandard` rebuilt** to integrate with the token system: proportionate type scale, token
  spacing, no mouse-parallax/reveal scripts; the `secondary` variant sits on `--surface-alt` with a
  bottom border so it reads as a distinct band.
- **`SectionFlow` fixed**: step circles now render the step number (were empty), and steps are visible
  without JavaScript (dropped the scroll-reveal that left them at `opacity:0`).
- **Navbar**: title-only brand constrained by a `.brand-title` class (plus a defensive `.brand-link h2`
  reset) so it no longer inherits the global heading clamp; the blog dropdown of individual article
  links was removed in favour of plain Blog and Products links.
- **`Carousel` reworked**: overlay side arrows (circular, token-styled) replace the right-aligned row;
  new `fit` prop (`uniform` = all image slides same height vs `auto` = native aspect), optional
  `counter` position indicator, click-to-zoom `<dialog>` lightbox, and a consistent inline-SVG icon
  set. The full-screen close button is pinned to the viewport corner (no longer overflows off-screen).
- **Cards restyled**: `BasicCard` and `ProductCard` drop the boxy 1px border for a clean shadow, and
  the image is full-bleed (top corners rounded, square bottom) instead of inset-and-rounded with a
  visible border gap.
- **Commerce cards & cart UX**: new `ProductBuyCard` (listing) with per-prop controls (add-to-cart,
  size chips with sold-out values disabled, quantity, "View details"), using an accessible
  stretched-link card; `VariantPicker` gains `showQuantity`/`hideOptions`/`compact`, an icon+label
  add-to-cart (label customizable per-prop and via `commerce.addToCartLabel`), and a
  discount-percentage badge on sale prices. The cart trigger can
  live in the navbar (`commerce.cartInNavbar`) or float, and the (mock or live) cart persists across
  navigation. Product detail upsell cards now show the price.
- **`tests/scaffold-check/`**: a manual smoke test that scaffolds a fresh consumer project from the
  working tree (`cli init --source`), installs, builds, and boots `just dev`, asserting HTTP 200 —
  the "builds in the repo, runs for a consumer" guarantee. Output is gitignored.
- **Commerce refinements**: listing cards drop the quantity stepper, keeping an icon+label add-to-cart
  (customizable text); the cart drawer shows the selected variant/size per line and uses the same
  grouped, bordered quantity stepper as the picker (fixed: its CSS was scoped and never matched the
  JS-built lines — now `:global`). [wiki/commerce.md](wiki/commerce.md) has a full step-by-step Shopify
  setup guide
  (Headless channel, public token, publishing, env vars, webhooks/build hook) and a "managing the
  store" table.
- **Dead code removed**: the `HeaderStandard` `effect` prop and `DetailLayout` `headerEffect` (no-ops
  after the redesign), the orphaned header/section-flow reveal scripts, and `pages/blog/interfaces.ts`
  (its one type inlined) — which also clears the stray `/blog/interfaces` build warning.
- **A11y (WCAG 2.2 AA / EAA 2026)**: commerce controls meet the 24px target-size minimum, the text
  logo is a `<span>` (out of the heading outline), product pages keep a correct heading order, and the
  new `/products`, product, and `/checkout-demo` pages are covered by the axe gate.
- **Blog markdown images** use relative, co-located paths (`![](./img.jpg)`) so `astro:assets`
  optimizes them and emits correct base-path URLs. Root-absolute `/img/...` paths 404 under a base
  path; the relative form is the Astro-native fix (and removes the deprecated `markdown.rehypePlugins`
  config, silencing the Astro 7 deprecation warning).
- **Navbar fixes**: the brand ("WALLE") is visible again — `NavbarResolver` no longer forwards an
  always-present `brand` slot token (Astro registers slot names statically, which was suppressing the
  variant's default brand); it now branches on `Astro.slots.has("brand")`, keeping the brand
  overridable. The image logo gained a default `.brand-logo` class that sizes reliably for raster
  **and SVG** (height-constrained, `--navbar-logo-height` token) and stays consumer-extensible. The
  demo navbar regained a real, article-free **"Company" dropdown** (Privacy Policy, Terms) so the
  dropdown feature stays demonstrated.
- **A11y — keyboard-scrollable regions**: a small `AbstractLayout` script makes an element focusable
  (`tabindex="0"` + `role="region"`) **only when its content actually overflows** and it has no
  focusable content of its own — satisfying WCAG 2.1.1 / axe `scrollable-region-focusable` for
  overflowing code blocks and wide tables (including consumer markdown) without adding spurious tab
  stops. Fixes a CI axe failure that only reproduced where fonts made a code block overflow.

- **BREAKING — unified component prop vocabulary.** Every `@walle` component now uses the shared
  API convention documented in [wiki/components.md](wiki/components.md#api-conventions). Consumer
  usages of `@walle` components need the following mechanical renames (find/replace):

  | Component        | Old prop                | New prop               |
  | ---------------- | ----------------------- | ---------------------- |
  | `Button`         | `link`                  | `href`                 |
  | `Button`         | `type` (visual style)   | `variant`              |
  | `Button`         | `buttonType`            | `type`                 |
  | `Button`         | `iconName`              | `icon`                 |
  | `Button`         | `disableEffects={true}` | `effects={false}`      |
  | `Button`         | `extraClass`            | `class`                |
  | `Badge`          | `color`                 | `variant`              |
  | `Badge`          | `link`                  | `href`                 |
  | `Badge`          | `iconName`              | `icon`                 |
  | `Badge`          | `extraClass`            | `class`                |
  | `BasicCard`      | `linkUrl`               | `href`                 |
  | `BasicCard`      | `linkTarget`            | `target`               |
  | `BasicCard`      | `imageUrl` + `imageAlt` | `image={{ src, alt }}` |
  | `BasicCard`      | `badge.color`           | `badge.variant`        |
  | `BasicCard`      | `extraClass`            | `class`                |
  | `HeaderStandard` | `imageSrc` + `imageAlt` | `image={{ src, alt }}` |
  | `Section`        | `type`                  | `variant`              |
  | `Section`        | `imageSrc` + `imageAlt` | `image={{ src, alt }}` |
  | `SectionFlow`    | `type`                  | `variant`              |
  | `Breadcrumbs`    | `items[].url`           | `items[].href`         |
  | `Breadcrumbs`    | `items[].iconName`      | `items[].icon`         |
  | `Breadcrumbs`    | `extraClass`            | `class`                |

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
