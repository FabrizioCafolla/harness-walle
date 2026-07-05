#!/usr/bin/env bash
# Scenario: schemaVersion enforcement. Validates that:
#   (a) a manifest without schemaVersion: 2 is rejected by `check`, with no reference to any
#       removed documentation (the CLI's own message is the full story)
#   (b) a freshly `init`-ed consumer always produces a valid, flat-layout schemaVersion 2 manifest

scenario_schema_version_enforcement() {
  local olddir="${SANDBOX_DIR}/old-manifest"
  local freshdir="${SANDBOX_DIR}/fresh-init"

  # --- (a) manifest without schemaVersion is rejected ---

  mkdir -p "$olddir/src/configs" "$olddir/.walle"
  cat >"$olddir/.walle/manifest.json" <<'JSON'
{
  "name": "legacy-site",
  "walleVersion": "a217a49",
  "modules": ["website"],
  "updatedAt": "2025-01-01T00:00:00Z"
}
JSON

  local out
  out="$(cli check -p "$olddir" 2>&1 || true)"
  if cli check -p "$olddir" >/dev/null 2>&1; then
    fail "check should fail on a manifest without schemaVersion: 2"
    return 1
  fi
  echo "$out" | grep -qi "schemaVersion" || { fail "check error should mention schemaVersion; got: $out"; return 1; }
  echo "$out" | grep -qi "migration" && { fail "check error should not reference a removed migration guide; got: $out"; return 1; }

  # --- (b) a fresh init always produces a valid schemaVersion 2 manifest ---

  cli init --source "$REPO_ROOT" -n fresh-init -m website -d "$SANDBOX_DIR" >/dev/null || \
    { fail "init failed"; return 1; }
  sandbox_install "$freshdir" || { fail "install failed (see ${freshdir}/.e2e-install.log)"; return 1; }

  local check_out
  check_out="$(cli check -p "$freshdir" 2>&1)" || { fail "check failed on fresh consumer: ${check_out}"; return 1; }

  node -e "
    const m = require('$freshdir/.walle/manifest.json');
    if (m.schemaVersion !== 2) { console.error('schemaVersion missing'); process.exit(1); }
    if (!m.walleVersion)       { console.error('walleVersion missing');   process.exit(1); }
    if (!Array.isArray(m.modules)) { console.error('modules missing');    process.exit(1); }
  " || { fail "fresh manifest is missing required fields"; return 1; }

  # Flat layout: @walle paths at root, no lib/ directory.
  assert_path_present "$freshdir/src/@walle" || return 1
  assert_path_absent  "$freshdir/lib"        || return 1
}
