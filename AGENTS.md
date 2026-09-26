# AGENTS.md

<!-- [harness-coding:START] managed by harness-coding template, do not edit manually -->

This repository was bootstrapped from the [harness-coding](https://github.com/FabrizioCafolla/harness-coding) template.

Template-managed files are kept in sync with upstream via `just harness-coding check` / `just harness-coding update` — `cli.sh` is never vendored locally, it's always fetched fresh from `main`.

Instructions and context for AI agents (Claude Code, GitHub Copilot, etc.) working in this repository.

## How to behave

Before anything else: you do not know everything, and you should not act like you do.

- **Search before you answer.** If a request touches something you are not certain about a tool, a convention, a file, a decision already made look it up first. Read the relevant files. Check the actual state of the project. Do not reconstruct from memory what you can verify directly.
- **Put yourself in doubt.** Before returning an answer, ask yourself: is this actually correct, or does it just sound correct? If you are not sure, say so explicitly and explain what you are uncertain about.
- **Do not agree by default.** If something Fabrizio says is wrong, incomplete, or heading in a bad direction, say so directly. Explain why. Propose something better. Agreement that is not earned is noise.
- **Behave like a professional in a discussion, not a tool executing commands.** Push back, ask follow-up questions, surface implications he may not have considered. The goal is to reach the best outcome, not to validate whatever was said.
- **Ask when the task is unclear.** Many requests will be generic or underspecified. Before producing output, assess whether you have enough context to do it well. If not, ask specifically, not generically. One focused question is better than a wrong answer.

## Tech stack

The development environment is DevContainer-based. The `.devcontainer/Dockerfile` uses a multi-stage build. The first stage (`base`) installs the core runtimes that are **always available**: Python 3.13 (managed by `uv`) and Node.js 24. These are copied from upstream images and always present in the final container. The same stage also installs OS-level tools like `just` (task runner) and system utilities. `pre-commit` is configured at the project level (`.pre-commit-config.yaml`) and always available. GitHub CLI (`gh`) is installed separately as a devcontainer feature defined in `devcontainer.json`.

The second stage (`tools`) is where all **optional tools** live. Each tool is gated behind a build arg (e.g. `AWS_CLI_ENABLE`, `CLAUDE_CLI_ENABLE`, `KIND_ENABLE`, `TERRAFORM_ENABLE`). Terraform is installed via `tfenv`, which allows switching versions inside the container with `tfenv install <version> && tfenv use <version>`. The Dockerfile defines defaults for these args, but **the actual values used in this project are determined by `.devcontainer/docker-compose.project.yml` (project defaults) and `.devcontainer/docker-compose.local.yml` (local overrides)**, which override at build time via Compose merge. To know which tools are actually installed, check these compose files — they are the source of truth, not the Dockerfile defaults.

## Development environment

All work happens inside the DevContainer. Do not assume tools are installed on the host machine. The container builds run `harnessai install` (`postCreateCommand`); every start runs `harnessai sync && just setup` (`postStartCommand`). AWS configuration lives in `.devcontainer/configs/.aws/`, and AI tool caches (Claude, Copilot, OpenCode, LLaMA) are persisted in `.devcontainer/cache/`.

### Three-layer file organization

This project follows a **three-layer model** for configuration:

1. **BASE** (template-managed, auto-updated): `docker-compose.yml`, `setup-devcontainer.sh`, `justfile`, `justfile.tooling` — updated when you run `just harness-coding update`
2. **PROJECT** (versionated, `.project` files): Shared defaults for all team members — `justfile.project`, `setup-devcontainer.project.sh`, `docker-compose.project.yml`, `.env.project`
3. **LOCAL** (dev-specific, `.local` files, gitignored): Personal customizations that are never committed — `justfile.local`, `setup-devcontainer.local.sh`, `docker-compose.local.yml`, `.env`

### Template files and `.project`/`.local` pattern

- **Base template files** (`justfile`, `docker-compose.yml`, etc.) are auto-updated and must not be edited manually
- **`.project` files** (versionated) contain project-wide defaults and are committed to git — all team members share these
- **`.local` files** (gitignored) contain personal/local customizations — never committed, each dev can customize freely

**Examples:**

- `justfile` (base, marker-managed) imports `justfile.project`, `justfile.local`, `justfile.tooling`, `justfile.private`
- `docker-compose.yml` (base) + `docker-compose.project.yml` (project) + `docker-compose.local.yml` (local) merge via Compose
- `.env.project` (versionated, project defaults) + `.env` (gitignored, local overrides) are both loaded at container startup

**Discover available commands with:**

```bash
just help
```

## What agents should avoid

- Do not modify `.devcontainer/` base files (Dockerfile, docker-compose.yml, setup-devcontainer.sh) unless asked — they are auto-updated by the template
- Do not modify `.project` files unless making changes that should be shared with the team — these are versionated
- Do edit `.local` files for personal/local customizations — these are gitignored and won't be committed
- Do not install packages globally inside the container without updating the Dockerfile or devcontainer features
<!-- [harness-coding:END] -->

## Project-specific context

Walle is a **copy-based Astro design system**. It is not published as an npm package: its `cli.sh`
copies the design-system source into a consumer project under `@walle/` paths, and the consumer
updates by re-running the CLI. This repo is both the product and its own demo site.

**Two zones, and which one you're in decides everything:**

- `walle/`: **the product**, everything shipped to consumers: `website/` (the managed
  `src/@walle/` engine plus the demo site), the module directories (`ci/`, `ai/`, `backend/`,
  `harness-coding/`), `cli/cli.sh` (the sync engine) and `walle.yml` (the managed, seed and inject
  map).
- everything else: dev tooling and repo meta, never shipped (`tests/e2e/`, `wiki/`, `.github/`).

**Engine conventions** (`walle/website/src/@walle/`):

- **Cascade layers.** All walle CSS lives in `@layer walle.base`, `walle.components` or
  `walle.utilities`; consumers write `@layer site`, which always wins. The order is declared once
  (`styles/layers.ts`) and rendered first in `<head>`. `tests/unit/css-layers.test.ts` fails on any
  unlayered walle rule.
- **Tokens are the only styling interface.** Components reference tokens from `styles/tokens.css`,
  each bridged to a `--walle-*` value a consumer sets in `theme.json`. No literal color, radius,
  shadow or px font size in a component (`tests/unit/css-tokens.test.ts`). Contrast pairs are
  enforced by `tests/unit/contrast.test.ts`.
- **One component model.** Variants (`primary`, `secondary`, `alternative`, `site`) are data
  attributes mapped to shared variant tokens; modifiers are boolean props (`outline`, `inverse`,
  `filled`, `muted`); every component publishes `--<component>-*` custom properties, keeps
  internals as `--_<component>-*`, and forwards `class`, `id` and other attributes to its root.
  Shared types and helpers live in `components/shared/`.
- **Overrides.** Embedded components (navbar, footer, card, breadcrumbs, page header, toc) are
  resolved through `virtual:walle-components` from `app.json` `components`; a walle original never
  imports that module.
- **Config single source of truth.** `config/schema.ts` (zod) defines every config file; types are
  inferred from it, `schemas/*.schema.json` is generated (`just schemas`), and the build stops on an
  invalid key with the file and key path.
- **Feature routes are injected, not seeded.** Products, the offline page, OG images and RSS feeds
  are routes walle injects when their `app.json` feature is on; a feature that is off adds nothing
  to the build.
- **Accessibility is a gate.** `tests/playwright/a11y.spec.ts` runs axe over every page and story
  at desktop and 320px; serious and critical findings fail.
- **Comments state constraints, not history.** Keep one or two sentences on a constraint the code
  relies on; rationale goes in the wiki, history in the CHANGELOG. No em or en dashes.

**Tests to run:**

- Every change: `yarn check` (types), `yarn test:unit`, `yarn lint`, `yarn build` in
  `walle/website/`.
- A change that only a browser can verify (layout, contrast, runtime behavior): the relevant
  Playwright or a11y spec, filtered to the touched stories or pages.
- A change to what consumers receive (CLI, seeds, managed files): the e2e scenario that covers it,
  run on its own; `just e2e` and `just e2e-extended` before a release. Add or update a scenario for
  every `cli.sh` change.
- `init` runs harness-coding's CLI first; override its source offline with
  `WALLE_HARNESS_CODING_CLI=<path-to-cli.sh>`.

Full detail: [CONTRIBUTING.md](CONTRIBUTING.md) and the [wiki](wiki/README.md), in particular
[Develop](wiki/develop/index.md) and [Architecture](wiki/architecture/index.md).
