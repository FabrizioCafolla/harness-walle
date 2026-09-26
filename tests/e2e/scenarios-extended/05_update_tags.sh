#!/usr/bin/env bash
# Scenario: update between real release tags, via CLI v2 against the published GitHub repo.
# Active-conditioned: runs only when the pinned oldest tag below and a newer tag both exist on
# the remote; otherwise auto-skips (sentinel 42) with a message, never a hard skip nor a failure.
#
# Oldest tag pinned to v0.4.0: older tags' seeded package.json lacks dependencies the current
# website needs (update never touches package.json), so their build fails without
# `walle deps --apply`.
MIN_OLDEST_TAG="v0.4.0"

scenario_update_tags() {
  local repo="https://github.com/FabrizioCafolla/harness-walle"
  local tags newest
  # Match the same tag shape resolve_latest_tag accepts (incl. prerelease suffixes like
  # -beta), so this exercises the real-tag path walle actually ships today, not just GA tags.
  tags="$(git ls-remote --tags --refs "$repo" 2>/dev/null |
    sed -n 's#.*refs/tags/\(v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*[-a-zA-Z0-9.]*\)$#\1#p' | sort -V)"
  newest="$(printf '%s\n' "$tags" | tail -1)"

  if ! printf '%s\n' "$tags" | grep -qx "$MIN_OLDEST_TAG" || [ "$MIN_OLDEST_TAG" = "$newest" ]; then
    log_skip "update between real tags, requires ${MIN_OLDEST_TAG} and a newer tag published (newest found: ${newest:-none})"
    return 42
  fi

  local oldest="$MIN_OLDEST_TAG" dir="${SANDBOX_DIR}/tags"

  cli init --walle-version "$oldest" -n tags -m website -d "$SANDBOX_DIR" >/dev/null ||
    { fail "init from ${oldest} failed"; return 1; }
  sandbox_install "$dir" || { fail "install failed"; return 1; }
  cli update --walle-version "$newest" --yes -p "$dir" >/dev/null ||
    { fail "update ${oldest} -> ${newest} failed"; return 1; }
  sandbox_build "$dir" || { fail "build after tag update failed"; return 1; }
  assert_path_present "$dir/dist/index.html"
}
