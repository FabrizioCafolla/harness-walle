#!/usr/bin/env bash
# Scenario: CLI v2 commands — dry-run (no-op), add <module>, and check — exercised via --source.

scenario_cli_commands() {
  local dir="${SANDBOX_DIR}/cli"

  cli init --source "$REPO_ROOT" -n cli -m website -d "$SANDBOX_DIR" >/dev/null || fail "init failed"
  sandbox_install "$dir" || { fail "install failed"; return 1; }

  # (a) update --dry-run from the same source changes nothing.
  local before after
  before="$(tree_checksum "$dir")"
  cli update --source "$REPO_ROOT" -p "$dir" --dry-run >/dev/null || { fail "dry-run update failed"; return 1; }
  after="$(tree_checksum "$dir")"
  [ "$before" = "$after" ] || { fail "dry-run modified files"; return 1; }

  # (b) add ci syncs the module's paths and records it in the manifest.
  cli add ci --source "$REPO_ROOT" -p "$dir" >/dev/null || { fail "add ci failed"; return 1; }
  assert_path_present "$dir/.github/workflows/actions/@walle" || return 1
  node -e "process.exit(require('$dir/.walle/manifest.json').modules.includes('ci')?0:1)" ||
    { fail "ci not recorded in manifest"; return 1; }

  # (c) check passes on a conformant consumer.
  cli check -p "$dir" >/dev/null 2>&1 || { fail "check failed on a conformant consumer"; return 1; }

  # (d) check fails on a v1 manifest.
  local v1="${SANDBOX_DIR}/cli-v1"
  mkdir -p "$v1/.walle"
  printf '{"name":"old","walleVersion":"abc123","updatedAt":"2026-01-01T00:00:00Z"}\n' >"$v1/.walle/manifest.json"
  if cli check -p "$v1" >/dev/null 2>&1; then
    fail "check should fail on a v1 manifest"
    return 1
  fi
}
