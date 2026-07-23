# Documentation

Walle is a **copy-based Astro design system**. Instead of being installed as an npm package, it copies its source directly into the consumer project under `@walle/` namespaces. The consumer owns those files in their repo and updates them by running the CLI.

## Use cases at a glance

| Scenario                              | Approach                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Start a new website project           | `cli.sh init` — seeds the starter from `walle/website/`, syncs the declared modules                       |
| Add walle to an existing project      | `cli.sh init` (no `--project-name`) in that directory — warns and asks for confirmation first             |
| Pull a new walle release              | `just walle-update` (or `cli.sh update`) — re-syncs MANAGED paths, leaves consumer zones untouched        |
| Add CI, backend, AI, or infra support | `cli.sh add <module>` — syncs the module's MANAGED paths and seeds its starter files once                 |
| Check a consumer is valid             | `cli.sh check` — read-only: manifest v2, version pin, schema validation; `--source` to diff managed paths |
| Browse components visually            | `just astrobook` — opens the Astrobook catalog at `http://localhost:4321/astrobook`                       |

## Quick reference

- [Repo guide](repo-guide.md) — how the walle repo itself is organized (for contributors)
- [CLI reference](cli.md) — all commands, flags, and error cases
- [Modules](modules.md) — what each module installs (MANAGED and SEED paths)
- [Managed vs seed](managed-vs-seed.md) — the two-class file model and update safety contract
- [Components](components.md) — component variants and customization patterns
- [Styling](styling.md) — theme config, semantic tokens, and the accessibility contract
- [Astrobook](astrobook.md) — visual component catalog (dev-only)
- [Versioning](versioning.md) — pinning `walleVersion`, update policy, `schemaVersion`

## How it works

1. A consumer runs `cli.sh init` with a project name and a list of modules. Walle first runs harness-coding's CLI to establish the base environment (`justfile`, `.devcontainer/`, git hooks — unless `--no-harness-coding`), then seeds the starter site from `walle/website/` (write-if-absent, safe against a directory that already has files), and finally syncs each module's MANAGED paths from the source (a release tag, or a local clone with `--source`). What is managed, seed, or inject is declared in `walle/walle.yml`.
2. Some modules also write SEED files — consumer-owned starters created once and never touched again by `update`.
3. The consumer edits their configs, pages, styles, and seed files freely. The `@walle/`-namespaced paths are read-only in the consumer; `update` rewrites only those.
4. `cli.sh check` reads the manifest and validates the consumer is on a v2 schema with a valid version pin.

The consumer manifest (`.walle/manifest.json`) records the project name, active modules, pinned `walleVersion`, and `schemaVersion: 2`.
