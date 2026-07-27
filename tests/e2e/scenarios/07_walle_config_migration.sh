#!/usr/bin/env bash
# Scenario: legacy consumer layouts self-heal on any command. (a) a root .walle.config.json
# migrates into .harness-walle/manifest.json on update; (b) an old `.walle/` state dir with a
# schemaVersion-2 files map (path->module) is renamed to `.harness-walle/` and reshaped to v3
# (module->[paths]) — content preserved, old paths gone, check passes.

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
  assert_path_present "$dir/.harness-walle/manifest.json" || return 1
  assert_file_contains "$dir/.harness-walle/manifest.json" '"name": "migrate"' || return 1
  assert_manifest_valid "$dir/.harness-walle/manifest.json" || return 1

  cli check -p "$dir" >/dev/null 2>&1 || { fail "check failed after migration"; return 1; }

  # (b) old `.walle/` state dir + v2 files map (path->module) -> `.harness-walle/` + v3 reshape.
  local d2="${SANDBOX_DIR}/migrate-dir"
  mkdir -p "$d2/.walle"
  cat >"${d2}/.walle/manifest.json" <<JSON
{
  "\$schema": "../schemas/walle.config.schema.json",
  "schemaVersion": 2,
  "name": "migrate-dir",
  "walleVersion": "local",
  "sourceRef": "${REPO_ROOT}",
  "modules": ["website"],
  "files": {
    "managed": { "src/@walle": "website", "schemas": "website" },
    "seed": {},
    "inject": { "AGENTS.md": "ai" }
  },
  "updatedAt": "2025-01-01T00:00:00Z"
}
JSON

  cli check -p "$d2" >/dev/null 2>&1 || { fail "check failed on old .walle/ dir"; return 1; }
  assert_path_absent  "$d2/.walle/manifest.json"        || return 1
  assert_path_present "$d2/.harness-walle/manifest.json" || return 1
  assert_manifest_valid "$d2/.harness-walle/manifest.json" || return 1
  D2="$d2" node -e '
    const m = require(process.env.D2 + "/.harness-walle/manifest.json");
    if (m.schemaVersion !== 3) { console.error("not v3"); process.exit(1); }
    const mg = m.files.managed;
    if (!Array.isArray(mg.website) || !mg.website.includes("src/@walle") || !mg.website.includes("schemas")) {
      console.error("managed.website not reshaped: " + JSON.stringify(mg)); process.exit(1);
    }
    if (!Array.isArray(m.files.inject.ai) || !m.files.inject.ai.includes("AGENTS.md")) {
      console.error("inject.ai not reshaped"); process.exit(1);
    }
  ' || { fail "files map not reshaped to v3"; return 1; }
}
