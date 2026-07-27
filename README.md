# Harness Walle Design System

Walle is an Astro design system for building a website end-to-end — dev to deploy. Its source is
copied into your project (nothing to install as a dependency), and modules cover the site,
CI/CD, and a component library tuned for UI/UX and SEO.

## Quickstart

```bash
# 1. Scaffold a new project — the one bootstrap step (you don't have `just` yet)
bash <(curl -fsSL https://raw.githubusercontent.com/FabrizioCafolla/harness-walle/main/walle/cli/cli.sh) \
  init --project-name my-site
```

`init` also sets up a ready-to-code **devcontainer** (via [harness-coding](https://github.com/FabrizioCafolla/harness-coding)):
open the folder in **VS Code** and choose **"Reopen in Container"** for a preconfigured environment
(Node, `just`, git hooks — nothing to install on your machine). From there, everything runs through
`just`:

```bash
cd my-site
just dev        # install deps + start the dev server → http://localhost:4321
just build      # production build
```

## What `init` does

One command scaffolds a complete, ready-to-run project, in order:

1. **Establishes the [harness-coding](https://github.com/FabrizioCafolla/harness-coding) base** — a
   ready-to-code **devcontainer** for VS Code (open the folder and "Reopen in Container": Node,
   `just`, git hooks, `.pre-commit-config.yaml` all preconfigured, nothing to install on your host),
   plus the `justfile` that fronts every command. Walle runs harness-coding's own CLI so these are
   always current, never a stale vendored copy. Skip with `--no-harness-coding`.
2. **Seeds the starter site** — `package.json`, `astro.config.mjs`, `src/configs/`, `src/pages/`,
   a starter `README.md`. Written once; yours to edit afterwards.
3. **Syncs the managed design system** — `src/@walle/`, schemas, the `walle` CLI. Overwritten on
   every `update`; never hand-edit.
4. **Injects module blocks** — walle's `justfile.project` targets, CI workflows (`--no-ci`),
   AGENTS.md + skills (`--no-ai`), into files you own, between markers.

No step needs a separate command — `init` is the whole thing. To exclude a module, pass its flag
at `init` (`--no-ci`, `--no-ai`, `--no-harness-coding`); `backend` is opt-in via
`just walle add backend`.

## How it works

Every file walle writes falls into one of three classes:

- **Managed** — the design system itself (`src/@walle/`, schemas). Read-only: `walle update`
  overwrites it with the latest release. Never hand-edit.
- **Seed** — starter files (README, CI workflow, API route). Written once, then yours; `update`
  never touches them again.
- **Inject** — small blocks kept in sync inside files you own (e.g. `justfile.project`), bounded
  by markers. Everything outside the markers is yours.

Everything you customize — configs, styles, pages, content — lives outside all three, in files
walle writes only at the first scaffold and never again. Full model:
[wiki/managed-vs-seed.md](wiki/managed-vs-seed.md).

```bash
just walle-update    # pull the latest release (managed files only)
just walle-check     # validate the project: manifest, version pin, configs
```

Your `package.json` is a **seed** file, so `update` never rewrites it — it would clobber the deps you
added. Instead, `update` reports any Walle-owned dependency that has fallen behind the release's tested
set, and `just walle-deps --apply` aligns just those (leaving your own dependencies alone):

```bash
just walle-deps            # report Walle-owned dependency drift (read-only)
just walle-deps --apply    # bump the behind Walle-owned deps
just yarn install          # update the lockfile
```

See [wiki/versioning.md](wiki/versioning.md#keeping-dependencies-current) and each release's
[CHANGELOG](CHANGELOG.md) `Dependencies` section.

## Features

`ci`, `ai`, and `harness-coding` are on by default at `init` — opt out per-module if you don't
want them. `backend` stays opt-in.

| Module           | Adds                                                                     | Enable / disable             |
| ---------------- | ------------------------------------------------------------------------ | ---------------------------- |
| `ci`             | GitHub Actions standard workflows                                        | on by default, `--no-ci` to skip |
| `ai`             | AGENTS.md + skills for this project                                      | on by default, `--no-ai` to skip |
| `harness-coding` | [Devcontainer environment](https://github.com/FabrizioCafolla/harness-coding) | on by default, `--no-harness-coding` to skip |
| `backend`        | Astro API routes (health check, echo, middleware)                        | `just walle add backend`     |

Details per module: [wiki/modules.md](wiki/modules.md).

## Examples

**Change the navbar** — edit `src/configs/navbar.json`, no code:

```json
{
  "logo": { "title": "My Site", "url": "/" },
  "items": [
    { "name": "Blog", "url": "/blog" },
    { "name": "GitHub", "url": "https://github.com/you", "target": "_blank" }
  ]
}
```

**Switch a component to its minimal variant** — add to `src/configs/app.json`:

```json
{ "components": { "navbar": "minimal", "footer": "minimal" } }
```

**Rebrand colors and fonts** — override CSS variables in `src/styles/global.css`:

```css
:root {
  --primary: #0046ad;
  --font-body: 'YourFont', system-ui, sans-serif;
}
```

**Replace a component entirely** — use Astro slots, no forking:

```astro
<BaseLayout>
  <MyNavbar slot="navbar" />
</BaseLayout>
```

More patterns (theming tokens, backend routes, adding a variant): [wiki/components.md](wiki/components.md), [wiki/cli.md](wiki/cli.md).

## For AI agents

Walle is built to be driven by AI coding agents end to end.

**Create a new project** — the one bootstrap step (the project has no `just` yet):

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/FabrizioCafolla/harness-walle/main/walle/cli/cli.sh) \
  init --project-name my-site --modules website,ci,ai
```

This scaffolds the site, a VS Code **devcontainer** (harness-coding), CI, and — via the `ai` module —
an `AGENTS.md` block plus two skills the agent then uses:

- **`walle-customize`** — change theme, navigation, pages, content, and commerce through the consumer
  zones (never the read-only `@walle/` paths).
- **`walle-update`** — pull a new release and reconcile dependencies.

From then on, **every command is a `just` recipe** — `just dev`, `just build`, `just validate-configs`,
`just walle-check`, `just walle-update`, `just walle-deps`. For agents working *on this repo* (not a
consumer), see [AGENTS.md](AGENTS.md).

## Wiki

- [wiki/repo-guide.md](wiki/repo-guide.md) how _this repo_ works (for contributors see [CONTRIBUTING.md](CONTRIBUTING.md))
- [wiki/modules.md](wiki/modules.md) · [wiki/managed-vs-seed.md](wiki/managed-vs-seed.md) · [wiki/components.md](wiki/components.md) · [wiki/cli.md](wiki/cli.md) · [wiki/astrobook.md](wiki/astrobook.md) · [wiki/versioning.md](wiki/versioning.md)
- [CHANGELOG.md](CHANGELOG.md) release history
