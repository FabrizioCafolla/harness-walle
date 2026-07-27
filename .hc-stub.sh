#!/usr/bin/env bash
ws=""
while [ $# -gt 0 ]; do case "$1" in --workspace) ws="$2"; shift 2 ;; *) shift ;; esac; done
[ -n "$ws" ] || exit 0
mkdir -p "$ws/.devcontainer/scripts"
printf '#!/usr/bin/env bash\n' >"$ws/.devcontainer/scripts/setup-devcontainer.project.sh"
printf 'services:\n' >"$ws/.devcontainer/docker-compose.project.yml"
# Base justfile mirrors harness-coding: it imports the consumer's justfile.project where
# walle injects its recipes (walle-setup, dev, build, ...).
printf "import? 'justfile.project'\n\ndefault:\n    @just --list\n" >"$ws/justfile"
