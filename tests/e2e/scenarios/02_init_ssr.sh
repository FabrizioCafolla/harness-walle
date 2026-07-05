#!/usr/bin/env bash
# Scenario: init a maximal sandbox (website, ci, ai) with SSR enabled, and verify the
# node adapter output is built and servable.

scenario_init_ssr() {
  local dir="${SANDBOX_DIR}/max"

  cli init --source "$REPO_ROOT" -n max -m website,ci,ai -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed"

  # ci module path synced; ai marker block present.
  assert_path_present "$dir/.github/workflows/actions/@walle" || return 1
  assert_file_contains "$dir/AGENTS.md" "[walle:START]" || return 1
  assert_file_contains "$dir/AGENTS.md" "[walle:END]" || return 1

  # Turn on SSR in the consumer config.
  node -e "const fs=require('fs');const p='$dir/src/configs/app.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.astro.ssr={enabled:true,adapter:'node'};fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');" \
    || fail "could not enable SSR in app.json" || return 1

  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" || fail "SSR build failed" || return 1

  # Adapter output present and servable (astro preview cannot serve SSR output).
  assert_path_present "$dir/dist/server/entry.mjs" || return 1
  http_expect_200 "http://127.0.0.1:4502/" "$dir" env HOST=127.0.0.1 PORT=4502 node ./dist/server/entry.mjs || return 1

  # Component markup in the SSR-rendered response, not just a 200.
  assert_body_contains 'data-component="Navbar"' || return 1
  assert_body_contains "Welcome to Walle" || return 1
}
