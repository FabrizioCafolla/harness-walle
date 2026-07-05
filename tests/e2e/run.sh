#!/usr/bin/env bash
# Walle e2e harness — fast core. Simulates a consumer project from the current local
# working tree (--source mode) and validates the things that actually gate a change.

set -uo pipefail

E2E_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${E2E_DIR}/lib/common.sh"

for s in "${E2E_DIR}"/scenarios/*.sh; do
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
  "CLI commands (dry-run, add, check)|scenario_cli_commands"
  "Component variants (valid variant renders, invalid fails build)|scenario_component_variants"
  "Old .walle.config.json migrates to .walle/manifest.json on update|scenario_walle_config_migration"
  ".vscode/ marker injection (fresh init + consumer edits survive update)|scenario_vscode_inject"
  ".husky/ seeded at init, consumer edits survive update|scenario_husky_seed"
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
echo " e2e: ${pass} passed, ${failed} failed, ${skipped} skipped"
echo "═══════════════════════════════════════════════"

# A fully green run cleans up after itself (sandboxes accumulate GBs across runs). Kept on
# any failure for debugging, and always kept if E2E_KEEP_SANDBOX is set.
if [ "$failed" -eq 0 ] && [ -z "${E2E_KEEP_SANDBOX:-}" ]; then
  rm -rf "$SANDBOX_DIR"
fi

[ "$failed" -eq 0 ]
