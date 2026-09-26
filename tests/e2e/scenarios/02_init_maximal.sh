#!/usr/bin/env bash
# Scenario: init a maximal sandbox (website, ci, ai) with the node adapter enabled, and verify
# the adapter output is built and servable.

scenario_init_maximal() {
  local dir="${SANDBOX_DIR}/max"

  cli init --source "$REPO_ROOT" -n max -m website,ci,ai -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed"

  # ci module path synced; ai marker block present.
  assert_path_present "$dir/.github/workflows/actions/@walle" || return 1
  assert_file_contains "$dir/AGENTS.md" "[walle:START]" || return 1
  assert_file_contains "$dir/AGENTS.md" "[walle:END]" || return 1

  # Turn on the node adapter in the consumer config.
  node -e "const fs=require('fs');const p='$dir/src/configs/app.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.astro.adapter='node';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');" \
    || fail "could not set astro.adapter in app.json" || return 1

  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" || fail "adapter build failed" || return 1

  # Adapter output present and servable (astro preview cannot serve on-demand routes).
  assert_path_present "$dir/dist/server/entry.mjs" || return 1
  http_expect_200 "http://127.0.0.1:4502/" "$dir" env HOST=127.0.0.1 PORT=4502 node ./dist/server/entry.mjs || return 1

  # Component markup in the adapter-served response, not just a 200.
  assert_body_contains 'data-component="Navbar"' || return 1
  assert_body_contains "Walle Design System" || return 1
}
