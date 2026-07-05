# Contributing to Walle

This is a guide for developing walle itself — not for consuming it in a website project. For
that, see the [README](README.md).

## Local environment

This repo's dev environment is a Docker devcontainer generated from the
[harness-coding](https://github.com/FabrizioCafolla/harness-coding) template — the same
template the `harness-coding` module targets for its injected extensions in every consumer (see
[Repo layout](#repo-layout) below).

**With VS Code**: open the folder, "Reopen in Container." Docker builds `.devcontainer/Dockerfile`,
`postCreateCommand` runs `just setup`, and you get Node ≥24, Yarn 4, `just`, and everything else
pinned. **Without VS Code** (any other editor, or a remote box): run `just setup` yourself once
Node/Yarn are on your PATH.

```bash
just setup   # installs dependencies (Node ≥24, Yarn 4) — also what postCreateCommand runs
just dev     # dev server at http://localhost:4321
```

Config for the devcontainer is layered in three files, only two of which are committed:

| Layer   | Files                                                          | Committed?             | Purpose                                                                              |
| ------- | --------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| BASE    | `docker-compose.yml`, `Dockerfile`, `setup-devcontainer.sh`      | yes (template-managed) | Upstream harness-coding defaults — don't hand-edit; see below                          |
| PROJECT | `docker-compose.project.yml`, `setup-devcontainer.project.sh`    | yes                    | This repo's shared overrides (tool versions, build args) — same for every contributor |
| LOCAL   | `docker-compose.local.yml`, `setup-devcontainer.local.sh`        | no (gitignored)        | Your personal tweaks — never affects anyone else                                      |

`devcontainer.json` merges all three Compose files in that order. BASE files are pulled from the
upstream template with the vendored CLI, not edited by hand.

## Repo layout

Two zones, two different audiences — knowing which one you're touching tells you where to
work and what breaks if you get it wrong. Full rationale in
[wiki/repo-guide.md](wiki/repo-guide.md); the short version:

```
harness-walle/
├── walle/                ← THE PRODUCT — everything shipped to consumers, grouped by module
│   ├── template/            curated starter scaffold seeded write-once into every fresh consumer
│   ├── website/             MANAGED source (src/@walle/, schemas/) — also this repo's own
│   │                          demo/showcase Astro site, dogfooding the product
│   ├── ci/, ai/, backend/, infrastructure/, harness-coding/   one dir per optional module
│   └── cli/                 cli.sh — the sync/scaffold engine, vendored into every consumer
├── tests/e2e/             ← dev tooling, never shipped: shell-script CLI harness (`just e2e`)
├── wiki/                  ← maintainer + consumer docs (this file, module/CLI/versioning refs)
└── justfile*, .github/    ← repo meta (CI, dev commands)
```

Inside `walle/website/` — the app itself:

```
walle/website/
├── src/@walle/         ← design-system source (MANAGED, synced into every consumer's src/@walle/)
├── src/pages/, src/configs/   ← this repo's own demo site content — dogfoods the product,
│                                ships nowhere else
├── schemas/            ← JSON Schemas for consumer configs + manifest (MANAGED)
├── astrobook/          ← component catalog stories (dev tooling, never shipped)
└── tests/{unit,playwright}/   ← this app's own unit + visual-regression specs (dev tooling)
```

**If you're changing what consumers receive** — a component, a schema, a CLI behavior, a seed
file, a CI composite action — you're working in `walle/`. Test with `just e2e` (simulates a real
consumer via `--source`) before anything else.

**If you're changing the demo site** — `walle/website/src/pages/`, `walle/website/src/configs/`,
content — you're customizing walle's own dogfood consumer, same as any real consumer would.

**If you're changing tooling** — a story in `astrobook/`, a spec under `walle/website/tests/` or
`tests/e2e/` — nothing here reaches a consumer. It exists to build confidence in the product.

## Testing a change

All commands below run from the repo root; `just` switches into `walle/website/` internally where
that's the relevant working directory (the e2e harness is the one exception — it runs from the
repo root since it exercises the CLI against the whole `walle/` tree).

```bash
just e2e               # real integration test: simulates a consumer via --source,
                        # across init/update/add/check and every module
just e2e-extended      # deeper coverage: marker injection, migrations, schema enforcement
yarn test               # lint + unit tests (vitest) — run inside walle/website
just validate-configs   # this repo's own demo-site configs against their schemas
just astrobook          # visual catalog for anything in src/@walle/components
just astrobook-test     # visual regression against committed baselines
just playwright-test-navbar  # navbar functional suite (explicit config, see playwright.config.ts)
```

`just e2e` is the one that matters most: it scaffolds a real consumer from your working tree and
exercises the CLI the same way a user would. Run it before opening a PR.

If you add or change a component, ship a story (`astrobook/`) and a visual regression baseline —
see [wiki/astrobook.md](wiki/astrobook.md). If you touch `cli.sh`, add or update an e2e scenario
under `tests/e2e/scenarios/` rather than testing by hand.

Lint and unit tests also run automatically via git hooks (`.husky/pre-commit` and
`.husky/pre-push`) — no separate step needed for those, just don't skip hooks with `--no-verify`.
Playwright is not in CI right now (disabled to save minutes); run it locally with the commands
above before a PR that touches components, layouts, or navbar/footer behavior.

## Conventions

- `just` for scripts, `yarn` for package installs — not `npm`.
- Don't hand-edit anything under a `@walle/` namespace in a _consumer_ project (that's the
  read-only contract this whole project exists to enforce) — but editing the walle _source_
  itself, in this repo, is exactly what you're here to do.
- Keep `walle/` (the product) and everything else (dev tooling, demo site) cleanly separated —
  see [wiki/repo-guide.md](wiki/repo-guide.md) for the boundary.

## Opening a PR

- Run `just e2e` and `yarn test` locally first (also enforced by the pre-commit/pre-push hooks).
- Update `CHANGELOG.md` under `[Unreleased]` if the change is user-visible.
- CI runs lint, unit tests, and the e2e harness. Playwright is currently disabled in CI (see
  [Testing a change](#testing-a-change)) — run it locally instead.

## Releasing

Maintainer-only — see [wiki/versioning.md](wiki/versioning.md#release-process).
