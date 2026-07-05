#!/usr/bin/env bash
# Scenario: selecting a registered non-standard component variant builds and renders it; an
# unregistered variant fails the build with an explicit message.

scenario_component_variants() {
  local dir="${SANDBOX_DIR}/variants"

  cli init --source "$REPO_ROOT" -n variants -m website -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed" || return 1
  sandbox_install "$dir" || fail "yarn install failed" || return 1

  # Valid non-standard variant builds and is rendered.
  node -e "const fs=require('fs');const p='$dir/src/configs/app.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.components={navbar:'minimal',footer:'minimal'};fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');" \
    || fail "could not select minimal variant" || return 1
  sandbox_build "$dir" || fail "valid variant build failed" || return 1
  grep -rl "navbar-minimal" "$dir/dist" >/dev/null 2>&1 || { fail "minimal navbar not rendered"; return 1; }

  # Unregistered variant must fail the build.
  node -e "const fs=require('fs');const p='$dir/src/configs/app.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.components={navbar:'does-not-exist'};fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');" \
    || fail "could not set invalid variant" || return 1
  if sandbox_build "$dir" >/dev/null 2>&1; then
    fail "build should fail on an unregistered variant"
    return 1
  fi
}
