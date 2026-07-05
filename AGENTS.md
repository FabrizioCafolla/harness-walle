# AGENTS.md

<!-- [harness-coding:START] managed by harness-coding template, do not edit manually -->

This repository was bootstrapped from the [harness-coding](https://github.com/FabrizioCafolla/harness-coding) template.

The `cli.sh` script keeps template-managed files in sync with upstream. Run `./cli.sh check` to see what changed, and `./cli.sh update` to apply updates.

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

1. **BASE** (template-managed, auto-updated): `docker-compose.yml`, `setup-devcontainer.sh`, `justfile`, `justfile.tooling` — updated when you run `cli.sh update`
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

<!-- TODO: Add anything specific to this project that an AI agent should know.
     This is the most important section to fill in when using this template.

Suggested content:
- Architecture overview or diagram reference
- Key files and their purpose
- Known limitations or areas to avoid
- External dependencies (APIs, databases, services)
- Links to internal documentation or runbooks
- Ongoing work or areas under active development
-->
