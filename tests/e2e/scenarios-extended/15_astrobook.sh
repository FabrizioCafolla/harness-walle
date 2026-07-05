#!/usr/bin/env bash
# Scenario: Astrobook dev tooling is NEVER synced to consumer projects.
# astrobook/ and *.stories.ts files exist in the walle repo for development,
# but must not appear in any consumer after init or update.

scenario_astrobook_isolation() {
  local dir="${SANDBOX_DIR}/astrobook-isolation"

  cli init --source "$REPO_ROOT" -n astrobook-isolation -m website,ci,ai -d "$SANDBOX_DIR" >/dev/null || \
    { fail "init failed"; return 1; }

  # astrobook/ directory must not be present in the consumer.
  assert_path_absent "$dir/astrobook" || return 1

  # No *.stories.ts files in the consumer tree.
  local story_count
  story_count="$(find "$dir" -name '*.stories.ts' -not -path '*/node_modules/*' | wc -l | tr -d ' ')"
  [ "$story_count" = "0" ] || { fail "consumer contains ${story_count} story file(s); expected none"; return 1; }

  # walle source itself must have astrobook/ with at least one story (regression guard).
  assert_path_present "$REPO_ROOT/walle/website/astrobook" || return 1
  local src_stories
  src_stories="$(find "$REPO_ROOT/walle/website/astrobook" -name '*.stories.ts' | wc -l | tr -d ' ')"
  [ "$src_stories" -gt 0 ] || { fail "walle source has no stories in astrobook/"; return 1; }

  # An update must not introduce astrobook files into the consumer either.
  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null 2>&1 || { fail "update failed"; return 1; }
  assert_path_absent "$dir/astrobook" || return 1
}
