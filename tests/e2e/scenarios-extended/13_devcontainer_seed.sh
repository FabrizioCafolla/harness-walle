#!/usr/bin/env bash
# Scenario: devcontainer scaffold is seeded by default at init and respects --no-devcontainer.

scenario_devcontainer_seed() {
  local dir_default="${SANDBOX_DIR}/devcontainer_default"
  local dir_disabled="${SANDBOX_DIR}/devcontainer_disabled"

  # Default: .devcontainer/devcontainer.json is created.
  cli init --source "$REPO_ROOT" -n devcontainer_default -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1
  assert_path_present "$dir_default/.devcontainer/devcontainer.json" \
    || return 1

  # Manifest records enabled: true.
  node -e "
    const m = require('$dir_default/.walle/manifest.json');
    if (!m.devcontainer || m.devcontainer.enabled !== true) {
      console.error('devcontainer.enabled should be true, got:', JSON.stringify(m.devcontainer));
      process.exit(1);
    }
  " || fail "manifest should record devcontainer.enabled=true" || return 1

  # --no-devcontainer: .devcontainer/ must NOT be created.
  cli init --source "$REPO_ROOT" -n devcontainer_disabled -d "$SANDBOX_DIR" --no-devcontainer >/dev/null \
    || fail "cli init --no-devcontainer failed" || return 1
  assert_path_absent "$dir_disabled/.devcontainer/devcontainer.json" \
    || return 1

  # Manifest records enabled: false.
  node -e "
    const m = require('$dir_disabled/.walle/manifest.json');
    if (!m.devcontainer || m.devcontainer.enabled !== false) {
      console.error('devcontainer.enabled should be false, got:', JSON.stringify(m.devcontainer));
      process.exit(1);
    }
  " || fail "manifest should record devcontainer.enabled=false" || return 1

  # update must not touch an existing .devcontainer/ (it is a seed).
  local orig
  orig=$(cat "$dir_default/.devcontainer/devcontainer.json")
  cli update --source "$REPO_ROOT" -p "$dir_default" >/dev/null \
    || fail "cli update failed" || return 1
  local after
  after=$(cat "$dir_default/.devcontainer/devcontainer.json")
  [ "$orig" = "$after" ] || fail "update must not modify .devcontainer/devcontainer.json" || return 1
}
