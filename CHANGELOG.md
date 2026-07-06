# Changelog

All notable changes to Walle are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); this project adheres to
[Semantic Versioning](wiki/versioning.md).

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
