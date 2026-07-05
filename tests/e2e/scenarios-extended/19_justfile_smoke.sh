#!/usr/bin/env bash
# Scenario: walle.justfile is retired (D3) — its recipes are injected as a marker block
# directly into the consumer's own justfile.project, no separate file, no `import` line.
# Smoke-test the chain (justfile -> justfile.project -> injected recipes) inside a real
# sandbox consumer, and assert the old layout is nowhere to be found.

scenario_justfile_smoke() {
  local dir="${SANDBOX_DIR}/justfile_smoke"

  cli init --source "$REPO_ROOT" -n justfile_smoke -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1

  assert_path_absent "${dir}/walle.justfile" || return 1
  assert_file_contains "${dir}/justfile.project" "# [walle:START]" || return 1
  assert_file_contains "${dir}/justfile.project" "# [walle:END]" || return 1
  if grep -qF "import 'walle.justfile'" "${dir}/justfile.project"; then
    fail "legacy import line still present in justfile.project" || return 1
  fi

  sandbox_install "$dir" || fail "yarn install failed" || return 1

  ( cd "$dir" && just validate-configs ) >/dev/null 2>&1 \
    || fail "just validate-configs failed inside a sandbox consumer" || return 1
  ( cd "$dir" && just walle-check ) >/dev/null 2>&1 \
    || fail "just walle-check failed inside a sandbox consumer" || return 1
}
