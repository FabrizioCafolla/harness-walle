# Changelog

All notable changes to Walle are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); this project adheres to
[Semantic Versioning](wiki/versioning.md).

## [Unreleased — 0.3.0]

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
  - `--gray-dark` `#6b7280` → `#69707d` (muted text on gray sections was 4.43:1)
  - Badge `success` `#2ecc71` → `#1f874b`, `warning` `#f39c12` → `#a36708`,
    `danger` `#e74c3c` → `#da2d1b` (white badge text was 2.1–3.9:1)

### Fixed

- `global.css` used invalid `rgb(var(--gray-light))` for `code` background and `hr` border —
  the value resolved to nothing; both now use semantic tokens.

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
