#!/usr/bin/env bash
# Scenario: `astro.adapter: "node"` gives "static by default, on-demand where declared":
# the backend module's `prerender = false` API route is served on demand by the node server,
# while regular content pages are already static files in dist/ before that server ever starts.

scenario_adapter() {
  local dir="${SANDBOX_DIR}/adapter"

  cli init --source "$REPO_ROOT" -n adapter -m website,backend -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed" || return 1

  node -e "const fs=require('fs');const p='$dir/src/configs/app.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.astro.adapter='node';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');" \
    || fail "could not set astro.adapter in app.json" || return 1

  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" || fail "adapter build failed" || return 1

  # Content pages are prebuilt static files, on disk before the node server ever starts.
  assert_path_present "$dir/dist/client/index.html" || return 1

  # The API route (prerender = false) is served on demand by the node adapter.
  assert_path_present "$dir/dist/server/entry.mjs" || return 1
  http_expect_200 "http://127.0.0.1:4526/api/health" "$dir" env HOST=127.0.0.1 PORT=4526 node ./dist/server/entry.mjs || return 1
}
