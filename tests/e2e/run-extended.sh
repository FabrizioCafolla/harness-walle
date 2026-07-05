#!/usr/bin/env bash
# Walle e2e harness — full suite (core + extended). Runs every scenario, including the
# deeper per-module behavioral checks (marker injection edge cases, migration paths,
# schema enforcement, devcontainer sync details, seed persistence, etc.) that `just e2e`
# skips for speed. Opt-in: run before merging a change that touches the CLI's sync/inject
# logic, or in a pre-release CI job. `just e2e-extended`.

set -uo pipefail

E2E_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${E2E_DIR}/lib/common.sh"
for s in "${E2E_DIR}"/scenarios/*.sh "${E2E_DIR}"/scenarios-extended/*.sh; do
  # shellcheck source=/dev/null
  source "$s"
done

# Fresh sandbox root for this run.
rm -rf "$SANDBOX_DIR"
mkdir -p "$SANDBOX_DIR"

SCENARIOS=(
  "Init minimal (website) → static build + preview 200|scenario_init_minimal"
  "Init maximal (website,ci,ai) + SSR → node server 200|scenario_init_ssr"
  "Update idempotent (same source → empty diff)|scenario_update_idempotent"
  "Seed persistence (consumer-owned seed survives update/re-add)|scenario_seed_persistence"
  "CI starter (ci module seeds usable workflows wired to @walle actions)|scenario_ci_starter"
  "Backend API route (SSR on → /api/health 200, seed survives update)|scenario_backend_api"
  "Infrastructure (infra module seeds IaC scaffold, survives update)|scenario_infrastructure"
  "Component variants (valid variant renders, invalid fails build)|scenario_component_variants"
  "Update propagation with fixture (consumer zones intact)|scenario_update_propagation"
  "CLI commands (dry-run, add, check)|scenario_cli_commands"
  "Update between real tags (active when ≥2 tags)|scenario_update_tags"
  "AI harness (ai module: complete AGENTS.md + MANAGED @walle skills)|scenario_ai_harness"
  "Devcontainer seed (seeded by default, --no-devcontainer skips, update leaves it intact)|scenario_devcontainer_seed"
  "Devcontainer MANAGED sync (update re-syncs MANAGED, add devcontainer re-seeds cleanly)|scenario_devcontainer_managed_sync"
  "schemaVersion enforcement (old manifest rejected, fresh init always passes check)|scenario_schema_version_enforcement"
  "Astrobook isolation (astrobook/ and stories never synced to consumers)|scenario_astrobook_isolation"
  "Manifest version schema (stable + prerelease + local walleVersion validate)|scenario_manifest_version_schema"
  "MDX content build (.mdx page builds → @astrojs/markdown-satteri/satteri engine resolves)|scenario_mdx_content_build"
  "Justfile smoke (injected justfile.project block, no walle.justfile, no import)|scenario_justfile_smoke"
  "Forwarder legacy (deprecated scripts/@walle/cli.sh execs the real CLI)|scenario_forwarder_legacy"
  "Adopt existing directory (warn+confirm, non-destructive, rejects re-adoption)|scenario_adopt_existing"
  "Marker injection (create/append/rewrite, idempotent, bash+YAML stay valid)|scenario_marker_injection"
  "Justfile migration (old walle.justfile+import consumer migrates cleanly on update)|scenario_justfile_migration"
)

pass=0 failed=0 skipped=0
for entry in "${SCENARIOS[@]}"; do
  name="${entry%%|*}"
  fn="${entry##*|}"
  echo
  echo "▶ ${name}"
  if "$fn"; then
    log_pass "$name"
    pass=$((pass + 1))
  else
    rc=$?
    if [ "$rc" = "42" ]; then
      skipped=$((skipped + 1))
    else
      log_fail "$name"
      failed=$((failed + 1))
    fi
  fi
done

echo
echo "═══════════════════════════════════════════════"
echo " e2e-extended: ${pass} passed, ${failed} failed, ${skipped} skipped"
echo "═══════════════════════════════════════════════"

# A fully green run cleans up after itself (sandboxes accumulate GBs across runs). Kept on
# any failure for debugging, and always kept if E2E_KEEP_SANDBOX is set.
if [ "$failed" -eq 0 ] && [ -z "${E2E_KEEP_SANDBOX:-}" ]; then
  rm -rf "$SANDBOX_DIR"
fi

[ "$failed" -eq 0 ]
