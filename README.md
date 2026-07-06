# Harness Walle Design System

Walle is an Astro design system for building a website end-to-end — dev to deploy. Its source is
copied into your project (nothing to install as a dependency), and modules cover infrastructure,
CI/CD, and a component library tuned for UI/UX and SEO.

## Quickstart

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/FabrizioCafolla/harness-walle/main/walle/cli/cli.sh) \
  init --project-name my-site

cd my-site && yarn install && yarn dev   # → http://localhost:4321
```

## How it works

Files land in one of three classes:

- **Managed** the design system itself (`src/@walle/`, plus a few shared files). Read-only:
  `walle update` overwrites them with the latest release. Never hand-edit these.
- **Seed** starter files (a README, a CI workflow, an API route) written once, then yours to
  change freely; `update` never touches them again.
- **Inject** small snippets kept in sync inside files you own (e.g. `justfile.project`),
  bounded by markers; the rest of the file is yours.

Everything you're meant to customize configs, styles, pages, content lives outside both,
in files walle never writes to after the first scaffold. Full model:
[wiki/managed-vs-seed.md](wiki/managed-vs-seed.md).

```bash
just walle update    # pull the latest release (managed files only)
just walle check     # validate the project: manifest, version pin, configs
```

## Features

`ci`, `ai`, and `harness-coding` are on by default at `init` — opt out per-module if you don't
want them. `backend` and `infrastructure` stay opt-in.

| Module           | Adds                                                                     | Enable / disable             |
| ---------------- | ------------------------------------------------------------------------ | ---------------------------- |
| `ci`             | GitHub Actions standard workflows                                        | on by default, `--no-ci` to skip |
| `ai`             | AGENTS.md + skills for this project                                      | on by default, `--no-ai` to skip |
| `harness-coding` | [Devcontainer environment](https://github.com/FabrizioCafolla/harness-coding) | on by default, `--no-harness-coding` to skip |
| `backend`        | Astro API routes (health check, echo, middleware)                        | `cli.sh add backend`         |
| `infrastructure` | Terraform/OpenTofu starter scaffold                                      | `cli.sh add infrastructure`  |

Details per module: [wiki/modules.md](wiki/modules.md).

## Examples

**Change the navbar** `src/configs/navbar.json`, no code:

```json
{
  "logo": { "title": "My Site", "url": "/" },
  "items": [
    { "name": "Blog", "url": "/blog" },
    { "name": "GitHub", "url": "https://github.com/you", "target": "_blank" }
  ]
}
```

**Switch a component to its minimal variant** add to your existing `src/configs/app.json`:

```json
{ "components": { "navbar": "minimal", "footer": "minimal" } }
```

**Rebrand colors and fonts** override CSS variables in `src/styles/global.css`:

```css
:root {
  --primary: #0046ad;
  --font-body: 'YourFont', system-ui, sans-serif;
}
```

**Replace a component entirely** Astro slots, no forking:

```astro
<BaseLayout>
  <MyNavbar slot="navbar" />
</BaseLayout>
```

More patterns (theming tokens, backend routes, adding a variant): [wiki/components.md](wiki/components.md), [wiki/cli.md](wiki/cli.md).

## Wiki

- [wiki/repo-guide.md](wiki/repo-guide.md) how _this repo_ works (for contributors see [CONTRIBUTING.md](CONTRIBUTING.md))
- [wiki/modules.md](wiki/modules.md) · [wiki/managed-vs-seed.md](wiki/managed-vs-seed.md) · [wiki/components.md](wiki/components.md) · [wiki/cli.md](wiki/cli.md) · [wiki/astrobook.md](wiki/astrobook.md) · [wiki/versioning.md](wiki/versioning.md)
- [CHANGELOG.md](CHANGELOG.md) release history
