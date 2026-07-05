#!/usr/bin/env bash
# Scenario: a consumer still on the walle-v0-2-0-consolidation layout (walle.justfile file +
# `import 'walle.justfile'` in justfile.project) migrates cleanly on the first `walle update`
# against this change's source — old file gone, import line gone, marker block injected in
# its place, and the consumer's own customizations in justfile.project survive untouched.

scenario_justfile_migration() {
  local dir="${SANDBOX_DIR}/justfile_migration"

  cli init --source "$REPO_ROOT" -n justfile_migration -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1

  # Roll the freshly-scaffolded consumer back to the old (pre-migration) shape: a standalone
  # walle.justfile plus an `import` line, and drop any injected marker block that init wrote.
  cat >"${dir}/walle.justfile" <<'EOF'
cli_filename := "./scripts/@walle/cli.sh"

walle *args:
    {{cli_filename}} {{args}}
EOF
  cat >"${dir}/justfile.project" <<'EOF'
import 'walle.justfile'

# consumer-owned customization — must survive migration untouched
my-custom-recipe:
    echo "hello from the consumer"
EOF

  cli update --source "$REPO_ROOT" -p "$dir" --yes >/dev/null \
    || fail "cli update failed" || return 1

  assert_path_absent "${dir}/walle.justfile" || return 1
  if grep -qF "import 'walle.justfile'" "${dir}/justfile.project"; then
    fail "legacy import line survived migration" || return 1
  fi
  assert_file_contains "${dir}/justfile.project" "# [walle:START]" || return 1
  assert_file_contains "${dir}/justfile.project" "# [walle:END]" || return 1
  assert_file_contains "${dir}/justfile.project" "walle-update" || return 1
  assert_file_contains "${dir}/justfile.project" "my-custom-recipe" || return 1
  assert_file_contains "${dir}/justfile.project" "hello from the consumer" || return 1
}
