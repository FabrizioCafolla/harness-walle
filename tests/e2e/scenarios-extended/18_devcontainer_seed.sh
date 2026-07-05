#!/usr/bin/env bash
# Scenario: devcontainer MANAGED behavior is marker injection, not whole-file sync. Walle never
# vendors a full .devcontainer/devcontainer.json (that stays harness-coding's own — see
# wiki/modules.md) — it only injects small blocks into setup-devcontainer.project.sh and
# docker-compose.project.yml, and seeds justfile.project + .husky/ once. Covers injection into
# a pre-existing file, injection into a target that doesn't exist yet (reduced form + warning),
# idempotence on update, and `add devcontainer`.

scenario_devcontainer_managed_sync() {
  local dir="${SANDBOX_DIR}/devcontainer_managed"

  # Simulate a consumer whose .devcontainer/ was already bootstrapped by harness-coding,
  # with its own PROJECT files present before walle ever runs.
  cli init --source "$REPO_ROOT" -n devcontainer_managed -d "$SANDBOX_DIR" --no-harness-coding >/dev/null \
    || fail "cli init --no-harness-coding failed" || return 1
  mkdir -p "$dir/.devcontainer/scripts"
  printf '#!/usr/bin/env bash\nset -e\necho "pre-existing harness-coding content"\n' \
    >"$dir/.devcontainer/scripts/setup-devcontainer.project.sh"
  printf 'services:\n  devcontainer:\n    build:\n      args:\n        - GH_CLI_ENABLE=true\n' \
    >"$dir/.devcontainer/docker-compose.project.yml"

  cli add devcontainer --source "$REPO_ROOT" -p "$dir" >/dev/null \
    || fail "cli add devcontainer failed" || return 1

  # Walle's block was appended, pre-existing content preserved.
  assert_file_contains "$dir/.devcontainer/scripts/setup-devcontainer.project.sh" "pre-existing harness-coding content" || return 1
  assert_file_contains "$dir/.devcontainer/scripts/setup-devcontainer.project.sh" "[walle:START]" || return 1
  assert_file_contains "$dir/.devcontainer/docker-compose.project.yml" "GH_CLI_ENABLE=true" || return 1
  assert_file_contains "$dir/.devcontainer/docker-compose.project.yml" "[walle:START]" || return 1
  bash -n "$dir/.devcontainer/scripts/setup-devcontainer.project.sh" || fail "injected setup script is not valid bash" || return 1
  command -v yq >/dev/null 2>&1 && { yq eval '.' "$dir/.devcontainer/docker-compose.project.yml" >/dev/null || fail "injected compose file is not valid YAML" || return 1; }

  # update re-injects the marker block idempotently (no drift, no duplication).
  local before_sha after_sha
  before_sha=$(sha256sum "$dir/.devcontainer/scripts/setup-devcontainer.project.sh" | cut -d' ' -f1)
  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || fail "cli update failed" || return 1
  after_sha=$(sha256sum "$dir/.devcontainer/scripts/setup-devcontainer.project.sh" | cut -d' ' -f1)
  [ "$before_sha" = "$after_sha" ] || fail "re-injecting an identical block must be idempotent" || return 1
  grep -c "\[walle:START\]" "$dir/.devcontainer/scripts/setup-devcontainer.project.sh" | grep -qx 1 \
    || fail "marker block must appear exactly once after update" || return 1

  # justfile.project (SEED path) untouched by update.
  local seed_before seed_after
  seed_before=$(cat "$dir/justfile.project")
  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || fail "cli update failed" || return 1
  seed_after=$(cat "$dir/justfile.project")
  [ "$seed_before" = "$seed_after" ] || fail "update must not modify SEED justfile.project" || return 1

  # Reduced form: no .devcontainer/ at all yet — inject_marker_block creates the files with
  # just the marker block (no crash), and a warning is printed.
  local dir_bare="${SANDBOX_DIR}/devcontainer_bare"
  cli init --source "$REPO_ROOT" -n devcontainer_bare -d "$SANDBOX_DIR" >"$dir_bare.init.log" 2>&1 \
    || fail "cli init failed" || return 1
  assert_path_present "$dir_bare/.devcontainer/scripts/setup-devcontainer.project.sh" || return 1
  assert_path_present "$dir_bare/.devcontainer/docker-compose.project.yml" || return 1
  assert_file_contains "$dir_bare/.devcontainer/scripts/setup-devcontainer.project.sh" "[walle:START]" || return 1
  grep -qi "no .devcontainer" "$dir_bare.init.log" || fail "expected a warning about missing .devcontainer/ (reduced form)" || return 1

  # add devcontainer re-seeds an opted-out consumer without adding "devcontainer" to modules[].
  local dir_readd="${SANDBOX_DIR}/devcontainer_readd"
  cli init --source "$REPO_ROOT" -n devcontainer_readd -d "$SANDBOX_DIR" --no-harness-coding >/dev/null \
    || fail "cli init --no-harness-coding failed" || return 1
  assert_path_absent "$dir_readd/.devcontainer" || return 1

  cli add devcontainer --source "$REPO_ROOT" -p "$dir_readd" >/dev/null \
    || fail "cli add devcontainer failed" || return 1
  assert_path_present "$dir_readd/.devcontainer/scripts/setup-devcontainer.project.sh" || return 1
  assert_path_present "$dir_readd/.husky/pre-commit" || return 1

  node -e "
    const m = require('$dir_readd/.walle/manifest.json');
    if ((m.modules || []).includes('devcontainer')) {
      console.error('modules[] must not contain \'devcontainer\' — it is a manifest flag, got:', JSON.stringify(m.modules));
      process.exit(1);
    }
    if (!m.devcontainer || m.devcontainer.enabled !== true) {
      console.error('devcontainer.enabled should be true after add, got:', JSON.stringify(m.devcontainer));
      process.exit(1);
    }
  " || fail "add devcontainer should set devcontainer.enabled=true without touching modules[]" || return 1
}
