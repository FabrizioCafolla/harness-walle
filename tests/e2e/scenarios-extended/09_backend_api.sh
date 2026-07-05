#!/usr/bin/env bash
# Scenario: the `backend` module seeds an API route that responds when SSR is enabled, and the
# seeded route is consumer-owned (survives an update).

scenario_backend_api() {
  local dir="${SANDBOX_DIR}/backend"

  cli init --source "$REPO_ROOT" -n backend -m website,backend -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed" || return 1

  # All backend SEED files must be present after init.
  assert_path_present "$dir/src/pages/api/health.ts" || return 1
  assert_path_present "$dir/src/pages/api/echo.ts" || return 1
  assert_path_present "$dir/src/middleware.ts" || return 1

  # Enable SSR (API routes require server output).
  node -e "const fs=require('fs');const p='$dir/src/configs/app.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.astro.ssr={enabled:true,adapter:'node'};fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');" \
    || fail "could not enable SSR in app.json" || return 1

  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" || fail "SSR build failed" || return 1
  assert_path_present "$dir/dist/server/entry.mjs" || return 1

  # The API route responds 200 (SSR output is served by the node entry, not astro preview).
  http_expect_200 "http://127.0.0.1:4504/api/health" "$dir" env HOST=127.0.0.1 PORT=4504 node ./dist/server/entry.mjs || return 1

  # All backend seeds are consumer-owned: an update must not touch any of them.
  printf '\n// consumer edit\n' >>"$dir/src/pages/api/health.ts"
  local before_health before_echo before_mw
  before_health="$(sha256sum "$dir/src/pages/api/health.ts" | cut -d' ' -f1)"
  before_echo="$(sha256sum "$dir/src/pages/api/echo.ts" | cut -d' ' -f1)"
  before_mw="$(sha256sum "$dir/src/middleware.ts" | cut -d' ' -f1)"
  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || fail "cli update failed" || return 1
  [ "$before_health" = "$(sha256sum "$dir/src/pages/api/health.ts" | cut -d' ' -f1)" ] || { fail "health.ts changed on update"; return 1; }
  [ "$before_echo"   = "$(sha256sum "$dir/src/pages/api/echo.ts"   | cut -d' ' -f1)" ] || { fail "echo.ts changed on update"; return 1; }
  [ "$before_mw"     = "$(sha256sum "$dir/src/middleware.ts"        | cut -d' ' -f1)" ] || { fail "middleware.ts changed on update"; return 1; }
}
