#!/usr/bin/env bash
# Scenario: app.json is validated at build time (schema.ts): an unknown key, a wrong
# type, and a removed key each fail `yarn build` with the file name and the key path, and
# the removed key's error additionally names its replacement.

# Applies the given JS patch function body to app.json's parsed object, in the given sandbox.
patch_app_json() {
  local dir="$1" patch="$2"
  node -e "
    const fs = require('fs');
    const p = '$dir/src/configs/app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    ($patch)(j);
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  " || fail "could not patch app.json"
}

# schema.ts's parseConfig throws `Invalid walle config in <fileName>:\n${z.prettifyError(...)}`
# (config/schema.ts). Prints just that block from a build log, so assertions below check the
# actual walle error, not any incidental "app.json"/"astro" text elsewhere in the log (a vite
# stack trace line always contains "astro", so a bare grep on the whole log never fails).
config_error_block() {
  grep -A6 "^Invalid walle config in app.json:$" "$1"
}

scenario_config_validation() {
  local dir="${SANDBOX_DIR}/cfgval"

  cli init --source "$REPO_ROOT" -n cfgval -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1
  sandbox_install "$dir" || fail "yarn install failed" || return 1
  cp "$dir/src/configs/app.json" "$dir/.e2e-app.json.orig"

  # Unknown key: build fails; z.prettifyError's block reads
  #   ✖ Unrecognized key: "notARealKey"
  #     → at astro
  patch_app_json "$dir" '(j) => { j.astro.notARealKey = true; }' || return 1
  if sandbox_build "$dir" >/dev/null 2>&1; then
    fail "build should fail on an unknown key"
    return 1
  fi
  local block
  block="$(config_error_block "$dir/.e2e-build.log")"
  [ -n "$block" ] || { fail "unknown-key: no 'Invalid walle config in app.json:' block in the log"; return 1; }
  echo "$block" | grep -q 'Unrecognized key: "notARealKey"' \
    || { fail "unknown-key error does not name notARealKey"; return 1; }
  echo "$block" | grep -q '→ at astro$' \
    || { fail "unknown-key error does not point at astro"; return 1; }
  cp "$dir/.e2e-app.json.orig" "$dir/src/configs/app.json"

  # Wrong type: build fails; z.prettifyError's block reads
  #   ✖ Invalid input: expected string, received number
  #     → at astro.basePath
  patch_app_json "$dir" '(j) => { j.astro.basePath = 123; }' || return 1
  if sandbox_build "$dir" >/dev/null 2>&1; then
    fail "build should fail on a wrong-type value"
    return 1
  fi
  block="$(config_error_block "$dir/.e2e-build.log")"
  [ -n "$block" ] || { fail "wrong-type: no 'Invalid walle config in app.json:' block in the log"; return 1; }
  echo "$block" | grep -q '→ at astro\.basePath$' \
    || { fail "wrong-type error does not point at astro.basePath"; return 1; }
  cp "$dir/.e2e-app.json.orig" "$dir/src/configs/app.json"

  # Removed key (astro.ssr): build fails; z.prettifyError's block reads
  #   ✖ This key has been removed. Use "astro.adapter" instead.
  #     → at astro.ssr
  patch_app_json "$dir" '(j) => { j.astro.ssr = { enabled: true }; }' || return 1
  if sandbox_build "$dir" >/dev/null 2>&1; then
    fail "build should fail on the removed astro.ssr key"
    return 1
  fi
  block="$(config_error_block "$dir/.e2e-build.log")"
  [ -n "$block" ] || { fail "removed-key: no 'Invalid walle config in app.json:' block in the log"; return 1; }
  echo "$block" | grep -q '→ at astro\.ssr$' \
    || { fail "removed-key error does not point at astro.ssr"; return 1; }
  echo "$block" | grep -q 'Use "astro.adapter" instead' \
    || { fail "removed-key error does not name the replacement astro.adapter"; return 1; }
  cp "$dir/.e2e-app.json.orig" "$dir/src/configs/app.json"

  # Restored to the valid config: the build gate is on the mutation, not the sandbox itself.
  sandbox_build "$dir" || fail "build should succeed once app.json is restored" || return 1
}
