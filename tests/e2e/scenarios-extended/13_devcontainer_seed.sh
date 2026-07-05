#!/usr/bin/env bash
# Scenario: harness-coding scaffold is seeded by default at init and respects --no-harness-coding.
# Walle never vendors a full .devcontainer/devcontainer.json (that stays harness-coding's own) —
# it only injects reduced-form blocks into setup-devcontainer.project.sh/docker-compose.project.yml
# and seeds justfile.project + .husky/ (see wiki/modules.md).

scenario_devcontainer_seed() {
  local dir_default="${SANDBOX_DIR}/devcontainer_default"
  local dir_disabled="${SANDBOX_DIR}/devcontainer_disabled"

  # Default: reduced-form .devcontainer/ files are created (no .devcontainer/ pre-existing).
  cli init --source "$REPO_ROOT" -n devcontainer_default -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1
  assert_path_present "$dir_default/.devcontainer/scripts/setup-devcontainer.project.sh" \
    || return 1
  assert_path_present "$dir_default/.devcontainer/docker-compose.project.yml" \
    || return 1
  assert_path_present "$dir_default/.husky/pre-commit" || return 1

  # Manifest records enabled: true.
  node -e "
    const m = require('$dir_default/.walle/manifest.json');
    if (!m.devcontainer || m.devcontainer.enabled !== true) {
      console.error('devcontainer.enabled should be true, got:', JSON.stringify(m.devcontainer));
      process.exit(1);
    }
  " || fail "manifest should record devcontainer.enabled=true" || return 1

  # --no-harness-coding: no .devcontainer/ scaffold, no .husky/ seed.
  cli init --source "$REPO_ROOT" -n devcontainer_disabled -d "$SANDBOX_DIR" --no-harness-coding >/dev/null \
    || fail "cli init --no-harness-coding failed" || return 1
  assert_path_absent "$dir_disabled/.devcontainer" || return 1
  assert_path_absent "$dir_disabled/.husky" || return 1

  # Manifest records enabled: false.
  node -e "
    const m = require('$dir_disabled/.walle/manifest.json');
    if (!m.devcontainer || m.devcontainer.enabled !== false) {
      console.error('devcontainer.enabled should be false, got:', JSON.stringify(m.devcontainer));
      process.exit(1);
    }
  " || fail "manifest should record devcontainer.enabled=false" || return 1

  # update must not touch an existing seed (.husky/pre-commit) — it's write-once.
  local orig
  orig=$(cat "$dir_default/.husky/pre-commit")
  cli update --source "$REPO_ROOT" -p "$dir_default" >/dev/null \
    || fail "cli update failed" || return 1
  local after
  after=$(cat "$dir_default/.husky/pre-commit")
  [ "$orig" = "$after" ] || fail "update must not modify .husky/pre-commit" || return 1
}
