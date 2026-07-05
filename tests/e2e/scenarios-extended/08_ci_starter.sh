#!/usr/bin/env bash
# Scenario: the `ci` module seeds usable starter workflows (test.yml/deploy.yml) that invoke the
# @walle composite actions; the seeds are consumer-owned and survive an update.

scenario_ci_starter() {
  local dir="${SANDBOX_DIR}/cistart"

  cli init --source "$REPO_ROOT" -n cistart -m website,ci -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed" || return 1

  # Starter workflows seeded and wired to the managed composite actions.
  assert_path_present "$dir/.github/workflows/test.yml" || return 1
  assert_path_present "$dir/.github/workflows/deploy.yml" || return 1
  assert_file_contains "$dir/.github/workflows/test.yml" "actions/@walle/website-tests" || return 1
  assert_file_contains "$dir/.github/workflows/deploy.yml" "actions/@walle/deploy-github-pages" || return 1
  # Managed composite actions present.
  assert_path_present "$dir/.github/workflows/actions/@walle" || return 1

  # The seed workflows are consumer-owned: an update must not touch them.
  printf '\n# consumer edit\n' >>"$dir/.github/workflows/test.yml"
  local before; before="$(sha256sum "$dir/.github/workflows/test.yml" | cut -d' ' -f1)"
  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || fail "cli update failed" || return 1
  local after; after="$(sha256sum "$dir/.github/workflows/test.yml" | cut -d' ' -f1)"
  [ "$before" = "$after" ] || { fail "ci seed test.yml changed on update"; return 1; }
}
