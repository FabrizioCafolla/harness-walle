# How this repo works

Three things live in this repository, each with a different audience. Knowing which one you're
touching tells you where to work and what breaks if you get it wrong.

## The three zones

```
harness-walle/
├── walle/                    ← THE PRODUCT — everything shipped to consumers (except website's src/@walle/),
│                                grouped by module — each answers "what does module X ship" on its own
│   ├── template/                 curated starter scaffold (justfile, configs, index.astro) seeded
│   │                                write-once into every fresh consumer, ahead of any module
│   ├── website/                  MANAGED source: website/src/@walle/, website/schemas/, plus the
│   │                                justfile.project inject/ block below — no separate seed/ of its own
│   ├── ci/                       managed/ (composite actions), seed/ (starter workflows)
│   ├── ai/                       managed/skills/ (managed Claude Code skills)
│   ├── backend/                  seed/ (starter API routes, middleware)
│   ├── infrastructure/           seed/ (starter Terraform/OpenTofu)
│   ├── harness-coding/           inject/ (setup-devcontainer.project.block.sh, docker-compose.project.block.yml),
│   │                                seed/ (.husky/, justfile.project) — no managed/: nothing vendored
│   │                                from harness-coding itself, see below
│   └── cli/                      cli.sh, validate-configs.mjs — cross-module engine
├── walle/website/               ← DEV TOOLING'S FIRST CONSUMER — the demo/showcase Astro site
│   ├── src/@walle/                 the design system source (also shipped; stays outside `walle/` — see below)
│   ├── schemas/                    JSON Schemas for consumer configs + manifest — cross-module
│   └── astrobook/, tests/          component stories + unit/playwright specs (dogfoods the product)
├── tests/e2e/                ← DEV TOOLING — never shipped, only used to build/verify walle itself
├── wiki/, CONTRIBUTING.md    ← repo docs (this file, module/CLI/versioning references)
└── justfile*, .github/       ← repo meta (CI, dev commands)
```

**Placement rule inside `walle/`:** if a file is re-synced on every `walle update` → `<module>/managed/`.
If it's written once and then belongs to the consumer → `<module>/seed/`. If it's a block injected
into a file walle doesn't own outright (a file that harness-coding or the consumer's own
`justfile.project` created) → `<module>/inject/`. `cli/`, `schemas/`, `template/` are cross-module —
shared engine/scaffold, not tied to one module.

**Why `harness-coding` has no `managed/`/`seed/`:** walle doesn't vendor any BASE devcontainer file
(`Dockerfile`, `docker-compose.yml`, the setup script — all harness-coding's own). It only
injects its own extensions (corepack+yarn install, build-arg overrides) as `[walle:START]/[walle:END]`
marker blocks into `setup-devcontainer.project.sh` and `docker-compose.project.yml` — files
harness-coding already seeds write-once. If those files don't exist yet, the injection creates
them containing just the walle block (reduced form) and warns to run harness-coding first.

**If you're changing what consumers receive** — a component, a schema, a CLI behavior, a seed
file, a CI composite action — you're working in `walle/` or `walle/website/src/@walle/`. Test with
`just e2e` (simulates a real consumer via `--source`) before anything else.

**If you're changing the demo site** — the pages under `walle/website/src/pages/`,
`walle/website/src/configs/`, content — you're customizing walle's own dogfood consumer, same as
any real consumer would. It doesn't ship anywhere except this repo's own gh-pages deploy.

**If you're changing tooling** — a story in `astrobook/`, a Playwright spec in `tests/`, an e2e
scenario — nothing here reaches a consumer. It exists to build confidence in the product.

### Why `src/@walle/` sits outside `walle/`

The design-system source imports the consumer's own configs by relative path
(`src/@walle/config.ts` does `import configs from "../configs"`), and that resolution happens
during Astro's config-loading phase, before any path alias is available. Every consumer —
including this repo's own demo site — has `src/@walle/` sitting next to `src/configs/`. Moving
the core into `walle/` would break that contract for everyone. It's still part of the product;
it just can't live inside the product root.

## What ships, and how

`cli.sh`'s `module_managed_map()` and `module_seed_paths()` are the source of truth for what
gets copied where — see [managed-vs-seed.md](managed-vs-seed.md) for the model and
[modules.md](modules.md) for the per-module breakdown. The short version: MANAGED paths
(`walle/cli` → consumer `scripts/@walle/`, `walle/schemas` → consumer `schemas/`, etc.) are
re-synced on every `walle update`; SEED paths are written once and then belong to the consumer.

**Modules are all optional except `website`.** A consumer can run walle with nothing but the
`website` module — no CI starter, no AI harness, no devcontainer. Concretely: a consumer does
**not** need [harness-coding](https://github.com/FabrizioCafolla/harness-coding) (the
`devcontainer` module is opt-out, not a hard dependency — `--no-harness-coding` at init) and does
**not** need [harness-ai](https://github.com/FabrizioCafolla/harness-ai) or Claude Code (the
`ai` module is opt-in). Don't design a module contract that assumes either is present.

## How to release

Full policy and the maintainer checklist live in [versioning.md](versioning.md#release-process).
In short: update `CHANGELOG.md`, confirm `just e2e` and `yarn test` are green, then
`just release vX.Y.Z` — it bumps `package.json`, commits, tags, and pushes; `release.yml`
publishes the GitHub release from the changelog entry.

## Verifying a change before it ships

- `just e2e` — the real integration test: scaffolds consumers from your working tree via
  `--source` and exercises init/update/add/check across every module, including a static+SSR
  build and a live server check.
- `just validate-configs` / `yarn lint` / `yarn test` — this repo's own demo site is consumer
  #1; keep it green the same way any consumer would.
- `just astrobook` / `just astrobook-test` — visual catalog and regression suite for anything in
  `src/@walle/components`.
