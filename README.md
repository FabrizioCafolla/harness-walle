# Harness Walle Design System

Walle is an Astro design system for building a website end-to-end: dev to deploy. Its source is
copied into your project (nothing to install as a dependency), and modules cover the site,
CI/CD, and a component library tuned for UI/UX and SEO.

## Quickstart

```bash
# 1. Scaffold a new project: the one bootstrap step (you don't have `just` yet)
bash <(curl -fsSL https://raw.githubusercontent.com/FabrizioCafolla/harness-walle/main/walle/cli/cli.sh) \
  init --project-name my-site
```

`init` also sets up a ready-to-code **devcontainer** (via [harness-coding](https://github.com/FabrizioCafolla/harness-coding)):
open the folder in **VS Code** and choose **"Reopen in Container"** for a preconfigured environment
(Node, `just`, git hooks: nothing to install on your machine). From there, everything runs through
`just`:

```bash
cd my-site
just dev        # install deps + start the dev server → http://localhost:4321
just build      # production build
```

## What `init` does

One command scaffolds a complete, ready-to-run project, in order:

1. **Establishes the [harness-coding](https://github.com/FabrizioCafolla/harness-coding) base**: a
   ready-to-code **devcontainer** for VS Code (open the folder and "Reopen in Container": Node,
   `just`, git hooks, `.pre-commit-config.yaml` all preconfigured, nothing to install on your host),
   plus the `justfile` that fronts every command. Walle runs harness-coding's own CLI so these are
   always current, never a stale vendored copy. Skip with `--no-harness-coding`.
2. **Seeds the starter site**: `package.json`, `astro.config.mjs`, `src/configs/`, `src/pages/`,
   a starter `README.md`. Written once; yours to edit afterwards.
3. **Syncs the managed design system**: `src/@walle/`, schemas, the `walle` CLI. Overwritten on
   every `update`; never hand-edit.
4. **Injects module blocks**: walle's `justfile.project` targets, CI workflows (`--no-ci`),
   AGENTS.md + skills (`--no-ai`), into files you own, between markers.

No step needs a separate command: `init` is the whole thing. To exclude a module, pass its flag
at `init` (`--no-ci`, `--no-ai`, `--no-harness-coding`); `backend` is opt-in via
`just walle add backend`.

## How it works

Every file walle writes falls into one of three classes:

- **Managed**: the design system itself (`src/@walle/`, schemas). Read-only: `walle update`
  overwrites it with the latest release. Never hand-edit.
- **Seed**: starter files (README, CI workflow, API route). Written once, then yours; `update`
  never touches them again.
- **Inject**: small blocks kept in sync inside files you own (e.g. `justfile.project`), bounded
  by markers. Everything outside the markers is yours.

Everything you customize (configs, styles, pages, content) lives outside all three, in files
walle writes only at the first scaffold and never again. Full model:
[managed vs seed](wiki/develop/managed-vs-seed.md).

```bash
just walle-update    # pull the latest release (managed files only)
just walle-check     # validate the project: manifest, version pin, configs
```

Your `package.json` is a **seed** file, so `update` never rewrites it: it would clobber the deps you
added. Instead, `update` reports any Walle-owned dependency that has fallen behind the release's tested
set, and `just walle-deps --apply` aligns just those (leaving your own dependencies alone):

```bash
just walle-deps            # report Walle-owned dependency drift (read-only)
just walle-deps --apply    # bump the behind Walle-owned deps
just yarn install          # update the lockfile
```

See [versioning](wiki/develop/versioning.md) and each release's
[CHANGELOG](CHANGELOG.md) `Dependencies` section.

## Features

`ci`, `ai`, and `harness-coding` are on by default at `init`: opt out per-module if you don't
want them. `backend` stays opt-in.

| Module           | Adds                                                                     | Enable / disable             |
| ---------------- | ------------------------------------------------------------------------ | ---------------------------- |
| `ci`             | GitHub Actions standard workflows                                        | on by default, `--no-ci` to skip |
| `ai`             | AGENTS.md + skills for this project                                      | on by default, `--no-ai` to skip |
| `harness-coding` | [Devcontainer environment](https://github.com/FabrizioCafolla/harness-coding) | on by default, `--no-harness-coding` to skip |
| `backend`        | Astro API routes (health check, echo, middleware)                        | `just walle add backend`     |

Details per module: [your first site](wiki/get-started/first-site.md) and [managed vs seed](wiki/develop/managed-vs-seed.md).

## Examples

**Change the navbar**: edit `src/configs/navbar.json`, no code:

```json
{
  "logo": { "title": "My Site", "url": "/" },
  "items": [
    { "name": "Blog", "url": "/blog" },
    { "name": "GitHub", "url": "https://github.com/you", "target": "_blank" }
  ]
}
```

**Switch a component to its minimal variant**: add to `src/configs/app.json`:

```json
{ "components": { "navbar": "minimal", "footer": "minimal" } }
```

**Rebrand colors and fonts**: set design values in `src/configs/theme.json` (fonts are
self-hosted at build time, no request to a font host):

```json
{
  "palette": { "primary": "#0046ad", "primary-contrast": "#ffffff" },
  "radii": { "md": "0.5rem" },
  "typography": { "fonts": [{ "role": "body", "name": "Inter", "provider": "google" }] }
}
```

**Restyle a component everywhere**: set its public custom properties in `src/styles/global.css`,
inside `@layer site`, which always wins over walle:

```css
@layer site {
  .button {
    --button-radius: 999px;
  }
}
```

**Replace a component entirely**: point an embedded component at your own file in `app.json`:

```json
{ "components": { "card": "./src/components/EventCard.astro" } }
```

More patterns: [the customization ladder](wiki/get-started/customize.md).

## Extension model

Walle's CSS lives in cascade layers (`walle.base`, `walle.components`, `walle.utilities`, `site`),
so your `@layer site` rules win without specificity tricks. Components use one vocabulary:
variants (`primary`, `secondary`, `alternative`, and a `site` variant you define), boolean
modifiers (`outline`, `inverse`, `filled`, `muted`) and public custom properties
(`--<component>-<property>`). Configuration in `src/configs/*.json` is validated at build time,
and optional features (commerce, offline page, social images, RSS feeds, redirects, a map) are
switched on in `app.json`, with walle providing the routes they need.

## For AI agents

Walle is built to be driven by AI coding agents end to end.

**Create a new project**: the one bootstrap step (the project has no `just` yet):

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/FabrizioCafolla/harness-walle/main/walle/cli/cli.sh) \
  init --project-name my-site --modules website,ci,ai
```

This scaffolds the site, a VS Code **devcontainer** (harness-coding), CI, and, via the `ai` module,
an `AGENTS.md` block plus two skills the agent then uses:

- **`walle-customize`**: change theme, navigation, pages, content, and commerce through the consumer
  zones (never the read-only `@walle/` paths).
- **`walle-update`**: pull a new release and reconcile dependencies.

From then on, **every command is a `just` recipe**: `just dev`, `just build`, `just validate-configs`,
`just walle-check`, `just walle-update`, `just walle-deps`. For agents working *on this repo* (not a
consumer), see [AGENTS.md](AGENTS.md).

## Wiki

- [Get started](wiki/get-started/index.md): [your first site](wiki/get-started/first-site.md),
  [customize](wiki/get-started/customize.md), [updating and migration guides](wiki/get-started/updating.md)
- [Develop](wiki/develop/index.md): working on this repo (for contributors see
  [CONTRIBUTING.md](CONTRIBUTING.md))
- [Architecture](wiki/architecture/index.md): configuration, components, style, e-commerce,
  CI/CD, PWA, SEO
- [AI](wiki/ai/index.md): the `AGENTS.md` block and managed skills
- [CHANGELOG.md](CHANGELOG.md): release history
