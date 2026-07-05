#!/usr/bin/env bash
# Scenario: `init` on an existing, non-walle directory warns and requires confirmation before
# writing anything; declining leaves the directory untouched; `--yes` adopts it without
# clobbering pre-existing files; re-running `init` on an already-adopted directory is a hard
# error that redirects to `update`/`add`.

scenario_adopt_existing() {
  local dir="${SANDBOX_DIR}/adopt"
  mkdir -p "$dir"
  printf 'keep me\n' >"${dir}/PRESERVE.md"

  # (a) declining the prompt writes nothing.
  if printf 'n\n' | cli init --source "$REPO_ROOT" -d "$dir" -m website >/dev/null 2>&1; then
    fail "init should abort when the adoption prompt is declined"
    return 1
  fi
  assert_path_absent "$dir/.walle/manifest.json" || return 1
  assert_file_contains "$dir/PRESERVE.md" "keep me" || return 1

  # (b) --yes adopts non-destructively: walle paths written, pre-existing file untouched.
  cli init --source "$REPO_ROOT" -d "$dir" -m website --yes >/dev/null \
    || { fail "adopt with --yes failed"; return 1; }
  assert_path_present "$dir/.walle/manifest.json" || return 1
  assert_path_present "$dir/src/@walle" || return 1
  assert_file_contains "$dir/PRESERVE.md" "keep me" || return 1

  # (c) re-running init on an already-adopted directory is a hard error, not a silent re-adopt.
  local out
  out="$(cli init --source "$REPO_ROOT" -d "$dir" -m website --yes 2>&1)" && {
    fail "init should refuse a directory that already has .walle/manifest.json"
    return 1
  }
  echo "$out" | grep -qi "already a walle project" \
    || { fail "error should explain the directory is already a walle project; got: $out"; return 1; }
}
