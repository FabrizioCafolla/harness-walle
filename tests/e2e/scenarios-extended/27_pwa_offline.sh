#!/usr/bin/env bash
# Scenario: pwa.offline (D12) — the built sw.js references the offline URL, the sitemap
# excludes it, and the offline page renders noindex, in a fresh consumer sandbox.

set_pwa_json() {
  local dir="$1" json="$2"
  node -e "
    const fs = require('fs');
    const p = '$dir/src/configs/app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.pwa = $json;
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  " || fail "could not set pwa in app.json"
}

scenario_pwa_offline() {
  local dir="${SANDBOX_DIR}/pwa-offline"

  cli init --source "$REPO_ROOT" -n pwa-offline -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1
  sandbox_install "$dir" || fail "yarn install failed" || return 1

  set_pwa_json "$dir" '{"enabled":true,"offline":true}' || return 1
  sandbox_build "$dir" \
    || { cat "${dir}/.e2e-build.log" >&2; fail "pwa-offline build failed"; return 1; }

  local sw="$dir/dist/sw.js"
  assert_path_present "$sw" || return 1
  assert_file_contains "$sw" "/offline" || return 1

  local offline_page="$dir/dist/offline/index.html"
  assert_path_present "$offline_page" || return 1
  assert_file_contains "$offline_page" 'name="robots" content="noindex' || return 1

  # The offline fallback never appears in the sitemap, but real pages still do.
  local sitemap="$dir/dist/sitemap-0.xml"
  assert_path_present "$sitemap" || return 1
  if grep -qE "/offline/?<" "$sitemap"; then
    fail "offline fallback should be excluded from sitemap.xml"
    return 1
  fi
  assert_file_contains "$sitemap" "<loc>" || return 1
}
