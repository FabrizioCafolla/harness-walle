#!/usr/bin/env bash
# Scenario: an old-shaped consumer (root .walle.config.json, no .walle/ folder) runs update and
# is cleanly migrated — manifest content preserved, old file gone, check passes.

scenario_walle_config_migration() {
  local dir="${SANDBOX_DIR}/migrate"
  mkdir -p "$dir"

  cat >"${dir}/.walle.config.json" <<JSON
{
  "\$schema": "./schemas/walle.config.schema.json",
  "schemaVersion": 2,
  "name": "migrate",
  "walleVersion": "local",
  "sourceRef": "${REPO_ROOT}",
  "modules": ["website"],
  "updatedAt": "2025-01-01T00:00:00Z"
}
JSON

  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || { fail "update failed"; return 1; }

  assert_path_absent "$dir/.walle.config.json" || return 1
  assert_path_present "$dir/.walle/manifest.json" || return 1
  assert_file_contains "$dir/.walle/manifest.json" '"name": "migrate"' || return 1
  assert_manifest_valid "$dir/.walle/manifest.json" || return 1

  cli check -p "$dir" >/dev/null 2>&1 || { fail "check failed after migration"; return 1; }
}
