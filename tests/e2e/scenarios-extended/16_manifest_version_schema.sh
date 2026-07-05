#!/usr/bin/env bash
# Scenario: the manifest schema accepts every walleVersion the CLI actually writes — stable
# tags, prerelease tags (the only releases walle ships today), and "local". Offline regression
# guard: init/update write the resolved tag verbatim into .walle/manifest.json, and `check`
# validates that manifest against schemas/walle.config.schema.json. A pattern that rejected
# prereleases (e.g. v0.1.0-beta) would make `check` fail on every real release.

scenario_manifest_version_schema() {
  local dir="${SANDBOX_DIR}/relver"
  mkdir -p "$dir/.walle"

  # A realistic manifest as written by `init`/`update` against a published prerelease tag:
  # walleVersion is the tag verbatim, no sourceRef (sourceRef is only for local source).
  cat >"$dir/.walle/manifest.json" <<'JSON'
{
  "$schema": "./schemas/walle.config.schema.json",
  "schemaVersion": 2,
  "name": "relver",
  "walleVersion": "v0.1.0-beta",
  "modules": ["website"],
  "devcontainer": { "enabled": true },
  "updatedAt": "2026-01-01T00:00:00Z"
}
JSON
  assert_manifest_valid "$dir/.walle/manifest.json" || return 1

  # Breadth + negative check: stable, prerelease and rc tags validate; a bare SHA does not.
  ( cd "$REPO_ROOT" && node -e "
    const Ajv=require('ajv').default||require('ajv');
    const af=require('ajv-formats').default||require('ajv-formats');
    const ajv=new Ajv({strict:false}); af(ajv);
    const v=ajv.compile(require('./walle/website/schemas/walle.config.schema.json'));
    const base={'\$schema':'x',schemaVersion:2,name:'x',modules:['website'],updatedAt:'2026-01-01T00:00:00Z'};
    for (const ver of ['v1.2.3','v0.1.0-beta','v2.0.0-rc.1']) {
      if(!v(Object.assign({},base,{walleVersion:ver}))){
        console.error('rejected valid version '+ver+': '+JSON.stringify(v.errors)); process.exit(1);
      }
    }
    if(v(Object.assign({},base,{walleVersion:'abc123'}))){
      console.error('accepted invalid version abc123'); process.exit(1);
    }
  " ) || { fail "walleVersion schema pattern wrong"; return 1; }
}
