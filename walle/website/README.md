# harness-coding

A GitHub template that gives every project the same fast, reproducible DevContainer in under a minute, plus a full AI coding context (skills, agents, hooks) wired in automatically via [harness-ai](https://github.com/FabrizioCafolla/harness-ai). Clone it, reopen in a container, start working no per-project setup, no manual AI tool configuration.

> **Opinionated by design.** Reflects a personal setup use it as a starting point and adapt it once cloned.

---

## Why

Standard devcontainer features compile tools from source (slow, non-deterministic). This template uses multi-stage Docker builds with pre-built runtimes: Python and Node.js are copied from their official images. First build takes ~30s instead of minutes.

Configuration is split into three layers:

- **BASE** template-managed files (`Dockerfile`, `docker-compose.yml`, `justfile`, etc.), updated via `cli.sh`
- **PROJECT** `*.project` files committed to git, shared across the team
- **LOCAL** `*.local` files gitignored, personal dev overrides

## What's included

|         | Tool                                  | Notes                                                       |
| ------- | ------------------------------------- | ----------------------------------------------------------- |
| Runtime | Python 3.13                           | via [uv](https://github.com/astral-sh/uv), multi-stage COPY |
| Runtime | Node.js 24                            | multi-stage COPY                                            |
| Shell   | zsh + Oh My Zsh                       | autosuggestions, syntax-highlighting, completions           |
| Tasks   | [just](https://github.com/casey/just) | see `just help`                                             |
| Hooks   | pre-commit                            | installed on first `just setup`                             |

**Optional tools** (disabled by default, enable via build args):

| Tool                                                                                   | Build ARG                        |
| -------------------------------------------------------------------------------------- | -------------------------------- |
| [Claude Code CLI](https://claude.ai/code)                                              | `CLAUDE_CLI_ENABLE=true`         |
| [GitHub Copilot CLI](https://githubnext.com/projects/copilot-cli)                      | `GITHUB_COPILOT_CLI_ENABLE=true` |
| [AWS CLI](https://aws.amazon.com/cli/)                                                 | `AWS_CLI_ENABLE=true`            |
| [OpenSpec](https://github.com/fission-ai/openspec)                                     | `OPENSPEC_ENABLE=true`           |
| [OpenCode](https://opencode.ai/)                                                       | `OPENCODE_ENABLE=true`           |
| [Kind](https://kind.sigs.k8s.io/)                                                      | `KIND_ENABLE=true`               |
| [LLaMA.cpp](https://github.com/ggml-org/llama.cpp)                                     | `LLAMA_CPP_ENABLE=true`          |
| [Terraform](https://www.terraform.io/) (via [tfenv](https://github.com/tfutils/tfenv)) | `TERRAFORM_ENABLE=true`          |

### Harness

The [harness-ai feature](https://github.com/FabrizioCafolla/harness-ai) in `devcontainer.json` assembles AI skills, agents, and hooks (including token-saving layers like RTK) into the workspace at container startup. It's config-driven: `postCreateCommand` runs `harnessai install`, `postStartCommand` runs `harnessai sync`, both reading `.harness-ai/config.yaml` (versioned, never overwritten by this template).

See the [harness-ai docs](https://github.com/FabrizioCafolla/harness-ai) for available `tools`, `install`, `behavior`, and `contentRepo` options this template only provisions the feature and a minimal default config, it doesn't duplicate harness-ai's own documentation.

## Getting started

**Requirements:** Docker, VSCode + [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

###  1. Open in VSCode

Run this on terminal:

```bash
git clone <your-project> ; cd <your-project>

curl -fsSL https://raw.githubusercontent.com/FabrizioCafolla/harness-coding/main/cli.sh | bash -s -- update --force
```

`--force` is required the first time: cli.sh refuses to run in a directory without `.devcontainer/` unless told to create one. Drop `--force` on every later `update` once the project has been scaffolded once.

### 2. Open in DevContainer

```cmd
Ctrl+Shift+P → Dev Containers: Reopen in Container
```

The container build runs `harnessai install`; every start runs `harnessai sync && just setup` automatically.

```bash
just help                        # list all commands
just gh-login                    # authenticate GitHub CLI
just claude-login                # authenticate Claude Code
```

## Customization

### Enable optional tools

Edit `.devcontainer/docker-compose.project.yml` for team-wide settings:

```yaml
services:
  devcontainer:
    build:
      args:
        CLAUDE_CLI_ENABLE: 'true'
        AWS_CLI_ENABLE: 'true'
```

Or `.devcontainer/docker-compose.local.yml` for local-only overrides (gitignored).

### Post-start setup

- `.devcontainer/scripts/setup-devcontainer.project.sh` team-wide, committed
- `.devcontainer/scripts/setup-devcontainer.local.sh` local dev, gitignored

### Just commands

- `justfile.project` team commands, committed
- `justfile.local` local commands, gitignored

### Environment variables

- `.env.project` shared env vars, committed
- `.env` local overrides, gitignored

Both are sourced automatically in each shell via `.zshrc`.

## Updating from template

```bash
bash cli.sh check     # see what changed upstream
bash cli.sh update    # apply updates
```

Or via curl (no local clone needed):

```bash
curl -fsSL https://raw.githubusercontent.com/FabrizioCafolla/harness-coding/main/cli.sh | bash -s -- check
curl -fsSL https://raw.githubusercontent.com/FabrizioCafolla/harness-coding/main/cli.sh | bash -s -- update
```

Options: `--ref REF`, `--force`, `--workspace DIR`

### File contract

| Category    | Files                                                                                    | Behavior                                               |
| ----------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| REPLACE     | `docker-compose.yml`, `setup-devcontainer.sh`, `justfile.tooling`, `cli.sh`              | Overwritten on `update`                                |
| MARKER      | `AGENTS.md`, `.pre-commit-config.yaml`, `.gitignore`, `Dockerfile`, `.zshrc`, `justfile` | Only the `[harness-coding:START/END]` block is updated |
| DIFF-ONLY   | `devcontainer.json`                                                                      | Diff shown, not auto-applied (`--force` to override)   |
| NEVER-TOUCH | `*.project`, `*.local`, `README.md`, `.harness-ai/config.yaml`, `.harness-coding/config.yml`       | Created once if missing, never overwritten             |
| DEPRECATED  | `update-devcontainer.sh`, `justfile.test`, `justfile.private`, others                    | Removed automatically on `update`                      |

`.harness-coding/config.yml` sets the template `version` (git ref) cli.sh resolves against; `--ref` on the CLI always wins. Every `update` writes `.harness-coding/lock` (resolved SHA) and `.harness-coding/manifest.json` (per-file category + hash) both versioned in git so the template state is shared and reproducible across the team.

## Project structure

```
.devcontainer/
├── Dockerfile                              # MARKER
├── docker-compose.yml                      # REPLACE
├── docker-compose.project.yml              # NEVER-TOUCH (team overrides)
├── docker-compose.local.yml                # NEVER-TOUCH (local overrides, gitignored)
├── devcontainer.json                       # DIFF-ONLY
├── configs/
│   ├── .zshrc                              # MARKER
│   └── .aws/
├── cache/                                  # mounted volumes (.claude, .copilot, .opencode, .llama)
└── scripts/
    ├── setup-devcontainer.sh               # REPLACE
    ├── setup-devcontainer.project.sh       # NEVER-TOUCH
    └── setup-devcontainer.local.sh         # NEVER-TOUCH (gitignored)
justfile                                    # MARKER (soli import)
justfile.tooling                     # REPLACE
justfile.project                            # NEVER-TOUCH
justfile.local                              # NEVER-TOUCH (gitignored)
.env.project                                # NEVER-TOUCH
.env                                        # gitignored
cli.sh                                      # REPLACE (template update script)
.harness-ai/config.yaml                     # NEVER-TOUCH (harness-ai provisioning)
.harness-coding/config.yml                  # NEVER-TOUCH (cli.sh ref pin)
.harness-coding/lock                        # written by cli.sh update, versioned
.harness-coding/manifest.json                # written by cli.sh update, versioned
AGENTS.md                                   # MARKER
.pre-commit-config.yaml                     # MARKER
```
