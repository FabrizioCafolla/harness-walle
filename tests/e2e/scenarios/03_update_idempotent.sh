#!/usr/bin/env bash
# Scenario: an update from the same source as init must change nothing (empty diff over
# the whole project, ignoring build output and the volatile manifest timestamp).

scenario_update_idempotent() {
  local dir="${SANDBOX_DIR}/min"
  [ -d "$dir" ] || { fail "min sandbox missing (init scenario must run first)"; return 1; }

  local before after
  before="$(tree_checksum "$dir")"
  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || fail "cli update failed" || return 1
  after="$(tree_checksum "$dir")"

  if [ "$before" != "$after" ]; then
    diff <(printf '%s\n' "$before") <(printf '%s\n' "$after") | head -20
    fail "update is not idempotent (tree changed)"
    return 1
  fi
}
