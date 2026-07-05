#!/usr/bin/env bash
# Scenario: the `infrastructure` module seeds consumer-owned IaC scaffolding that survives updates;
# if terraform is available, the scaffold passes `terraform validate` (never `apply`).

scenario_infrastructure() {
  local dir="${SANDBOX_DIR}/infra"

  cli init --source "$REPO_ROOT" -n infra -m website,infrastructure -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed" || return 1

  # All infrastructure SEED files must be present after init.
  assert_path_present "$dir/infrastructure/main.tf" || return 1
  assert_path_present "$dir/infrastructure/variables.tf" || return 1
  assert_path_present "$dir/infrastructure/providers.tf" || return 1
  assert_path_present "$dir/infrastructure/outputs.tf" || return 1
  assert_path_present "$dir/infrastructure/README.md"    || return 1
  assert_path_present "$dir/infrastructure/.gitignore"   || return 1
  assert_file_contains "$dir/infrastructure/.gitignore" "*.tfstate" || return 1

  # Validate the scaffold with terraform (no apply, no backend). In CI, terraform is always
  # installed and network is available (see test.yml), so absence or a real validate failure
  # there is a genuine regression, not a soft-skip. Locally (no network guarantee, terraform
  # optional) both stay tolerant.
  if command -v terraform >/dev/null 2>&1; then
    if ( cd "$dir/infrastructure" && terraform init -backend=false -input=false >/dev/null 2>&1 && terraform validate >/dev/null 2>&1 ); then
      log "terraform validate ok"
    elif [ "${CI:-}" = "true" ]; then
      fail "terraform validate failed in CI (network/provider issues are not expected here)" || return 1
    else
      log "terraform validate skipped (offline or provider unavailable)"
    fi
  elif [ "${CI:-}" = "true" ]; then
    fail "terraform not installed in CI — scenario 10 requires it (see test.yml)" || return 1
  else
    log "terraform not installed — skipping validate (local only)"
  fi

  # All infrastructure seeds are consumer-owned: an update must not touch any of them.
  printf '\n# consumer edit\n' >>"$dir/infrastructure/main.tf"
  local before_main before_providers before_outputs
  before_main="$(sha256sum "$dir/infrastructure/main.tf" | cut -d' ' -f1)"
  before_providers="$(sha256sum "$dir/infrastructure/providers.tf" | cut -d' ' -f1)"
  before_outputs="$(sha256sum "$dir/infrastructure/outputs.tf" | cut -d' ' -f1)"
  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || fail "cli update failed" || return 1
  [ "$before_main"      = "$(sha256sum "$dir/infrastructure/main.tf"      | cut -d' ' -f1)" ] || { fail "main.tf changed on update"; return 1; }
  [ "$before_providers" = "$(sha256sum "$dir/infrastructure/providers.tf" | cut -d' ' -f1)" ] || { fail "providers.tf changed on update"; return 1; }
  [ "$before_outputs"   = "$(sha256sum "$dir/infrastructure/outputs.tf"   | cut -d' ' -f1)" ] || { fail "outputs.tf changed on update"; return 1; }
}
