#!/usr/bin/env bash
# Scenario: the deprecated forwarder at scripts/@walle/cli.sh (kept on main so v0.1.0
# consumers self-heal via `just walle-update`) execs the real CLI. WALLE_FORWARD_SRC lets
# this run fully offline against the working tree instead of curling main.

scenario_forwarder_legacy() {
  local forwarder="${REPO_ROOT}/scripts/@walle/cli.sh"

  # Only relevant once a legacy forwarder has actually been committed for backward compat
  # with a prior release — doesn't exist yet pre-v0.1.0 (first release, no prior consumers).
  if [ ! -f "$forwarder" ]; then
    log_skip "forwarder legacy — no scripts/@walle/cli.sh forwarder committed yet"
    return 42
  fi

  local dir="${SANDBOX_DIR}/forwarder"

  cli init --source "$REPO_ROOT" -n forwarder -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1

  WALLE_FORWARD_SRC="${REPO_ROOT}/walle/cli/cli.sh" bash "$forwarder" check -p "$dir" >/dev/null 2>&1 \
    || fail "forwarder did not exec the real CLI (check failed)" || return 1
}
