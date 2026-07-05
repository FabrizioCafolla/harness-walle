#!/usr/bin/env bash
# Scenario: update between real release tags, via CLI v2 against the published GitHub repo.
# Active-conditioned: runs only when >=2 tags exist; otherwise auto-skips (sentinel 42) with a
# message — never a hard skip nor a failure.

scenario_update_tags() {
  local repo="https://github.com/FabrizioCafolla/walle-design-system"
  local tags count
  # Match the same tag shape resolve_latest_tag accepts (incl. prerelease suffixes like
  # -beta), so this exercises the real-tag path walle actually ships today, not just GA tags.
  tags="$(git ls-remote --tags --refs "$repo" 2>/dev/null |
    sed -n 's#.*refs/tags/\(v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*[-a-zA-Z0-9.]*\)$#\1#p' | sort -V)"
  count="$(printf '%s\n' "$tags" | grep -c '^v' || true)"

  if [ "${count:-0}" -lt 2 ]; then
    log_skip "update between real tags — requires >=2 published tags (found ${count:-0})"
    return 42
  fi

  local oldest newest dir="${SANDBOX_DIR}/tags"
  oldest="$(printf '%s\n' "$tags" | head -1)"
  newest="$(printf '%s\n' "$tags" | tail -1)"

  cli init --walle-version "$oldest" -n tags -m website -d "$SANDBOX_DIR" >/dev/null ||
    { fail "init from ${oldest} failed"; return 1; }
  sandbox_install "$dir" || { fail "install failed"; return 1; }
  cli update --walle-version "$newest" --yes -p "$dir" >/dev/null ||
    { fail "update ${oldest} -> ${newest} failed"; return 1; }
  sandbox_build "$dir" || { fail "build after tag update failed"; return 1; }
  assert_path_present "$dir/dist/index.html"
}
