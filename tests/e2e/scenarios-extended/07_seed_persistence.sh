#!/usr/bin/env bash
# Scenario: a SEED file (consumer-owned, e.g. README.md) is written once at init and never
# touched by update; re-running `add` on the module must not overwrite it either.

scenario_seed_persistence() {
  local dir="${SANDBOX_DIR}/min"
  [ -d "$dir" ] || { fail "min sandbox missing (init scenario must run first)"; return 1; }

  # The website seed README must be present after init.
  assert_path_present "$dir/README.md" || return 1

  # Consumer edits the seed.
  printf '\nCONSUMER EDIT %s\n' "$(date +%s)" >>"$dir/README.md"
  local before; before="$(sha256sum "$dir/README.md" | cut -d' ' -f1)"

  # Update from the same source must NOT touch the seed.
  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || fail "cli update failed" || return 1
  local after; after="$(sha256sum "$dir/README.md" | cut -d' ' -f1)"
  [ "$before" = "$after" ] || { fail "seed README changed on update"; return 1; }

  # Re-adding the website module must not overwrite the existing seed.
  cli add website --source "$REPO_ROOT" -p "$dir" >/dev/null || fail "cli add website failed" || return 1
  local after2; after2="$(sha256sum "$dir/README.md" | cut -d' ' -f1)"
  [ "$before" = "$after2" ] || { fail "seed README changed on re-add"; return 1; }
}
