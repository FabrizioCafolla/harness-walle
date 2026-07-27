#!/usr/bin/env bash
# Scenario: `walle deps` reports Walle-owned dependency drift and `--apply` aligns package.json
# without touching consumer-added deps. package.json is seed-owned, so `update` never rewrites
# it — `deps` is how a consumer catches up on Walle's tested dependency set.

scenario_deps() {
  local dir="${SANDBOX_DIR}/deps"

  cli init --source "$REPO_ROOT" -n deps -m website -d "$SANDBOX_DIR" >/dev/null ||
    { fail "init failed"; return 1; }

  # Downgrade a Walle-owned dep below the seed, and add a consumer-only dep.
  DIR="$dir" node -e '
    const fs = require("fs"), p = process.env.DIR + "/package.json";
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    j.dependencies.astro = "^7.0.0";
    j.dependencies["my-own-lib"] = "^1.0.0";
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  ' || { fail "could not edit package.json"; return 1; }

  # (a) deps reports the drift.
  cli deps --source "$REPO_ROOT" -p "$dir" 2>/dev/null | grep -q "behind the tested set" ||
    { fail "deps did not report drift"; return 1; }

  # (b) deps --apply aligns astro to the seed range and leaves the consumer dep untouched.
  cli deps --apply --source "$REPO_ROOT" -p "$dir" >/dev/null 2>&1 ||
    { fail "deps --apply failed"; return 1; }
  DIR="$dir" REPO="$REPO_ROOT" node -e '
    const fs = require("fs");
    const seed = JSON.parse(fs.readFileSync(process.env.REPO + "/walle/website/package.json", "utf8"));
    const c = JSON.parse(fs.readFileSync(process.env.DIR + "/package.json", "utf8"));
    if (c.dependencies.astro !== seed.dependencies.astro) { console.error("astro not aligned"); process.exit(1); }
    if (c.dependencies["my-own-lib"] !== "^1.0.0") { console.error("consumer dep clobbered"); process.exit(1); }
  ' || { fail "deps --apply did not align correctly"; return 1; }

  # (c) re-check is clean.
  cli deps --source "$REPO_ROOT" -p "$dir" 2>/dev/null | grep -q "up to date" ||
    { fail "deps still reports drift after apply"; return 1; }

  # (d) A missing runtime dep is a build breaker (synced commerce code hard-imports it):
  #     check flags it, --apply adds it. A missing devDependency stays opt-out.
  DIR="$dir" node -e '
    const fs = require("fs"), p = process.env.DIR + "/package.json";
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    delete j.dependencies["@nanostores/persistent"];   // required runtime dep
    delete j.devDependencies.vitest;                   // optional tooling
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  ' || { fail "could not remove deps"; return 1; }

  cli deps --source "$REPO_ROOT" -p "$dir" 2>/dev/null | grep -q "required Walle runtime dependency" ||
    { fail "deps did not flag missing runtime dep"; return 1; }

  cli deps --apply --source "$REPO_ROOT" -p "$dir" >/dev/null 2>&1 ||
    { fail "deps --apply (missing) failed"; return 1; }
  DIR="$dir" REPO="$REPO_ROOT" node -e '
    const fs = require("fs");
    const seed = JSON.parse(fs.readFileSync(process.env.REPO + "/walle/website/package.json", "utf8"));
    const c = JSON.parse(fs.readFileSync(process.env.DIR + "/package.json", "utf8"));
    if (c.dependencies["@nanostores/persistent"] !== seed.dependencies["@nanostores/persistent"])
      { console.error("runtime dep not added"); process.exit(1); }
    if ((c.devDependencies || {}).vitest != null)
      { console.error("optional devDependency was force-added"); process.exit(1); }
  ' || { fail "deps --apply did not add missing runtime dep correctly"; return 1; }
}
