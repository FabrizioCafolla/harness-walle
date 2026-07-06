#!/usr/bin/env bash
# Scenario: init a minimal sandbox (modules: website) and verify a clean, buildable,
# servable consumer with the module whitelist respected.

scenario_init_minimal() {
  local dir="${SANDBOX_DIR}/min"

  cli init --source "$REPO_ROOT" -n min -m website -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed"

  # Manifest present and valid (walleVersion: local + sourceRef), under .walle/, alongside
  # config.yml, lock, and the curated docs subset. No root .walle.config.json.
  assert_path_absent "$dir/.walle.config.json" || return 1
  assert_path_present "$dir/.walle/manifest.json" || return 1
  assert_manifest_valid "$dir/.walle/manifest.json" || return 1
  assert_file_contains "$dir/.walle/manifest.json" '"walleVersion": "local"' || return 1
  assert_path_present "$dir/.walle/config.yml" || return 1
  assert_path_present "$dir/.walle/lock" || return 1
  assert_path_present "$dir/.walle/docs/cli.md" || return 1

  # Whitelist: ci and ai paths must NOT exist.
  assert_path_absent "$dir/.github/workflows/actions/@walle" || return 1
  assert_path_absent "$dir/AGENTS.md" || return 1

  # Clean scaffold: no repo-internal files leaked, and no trace of the walle/ product root
  # itself — the consumer only ever gets the resolved MANAGED/SEED paths inside it.
  local leaked
  for leaked in tests openspec CHANGELOG.md VERSIONING.md template walle node_modules; do
    assert_path_absent "$dir/$leaked" || return 1
  done

  # Website module paths present.
  assert_path_present "$dir/src/@walle" || return 1
  assert_path_present "$dir/schemas" || return 1
  assert_path_present "$dir/scripts/@walle/cli.sh" || return 1

  # Build (exit 0, static dist) and serve the homepage.
  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" || fail "just build did not exit 0" || return 1
  assert_path_present "$dir/dist/index.html" || return 1

  # Component markup, not just a 200: the template page renders Navbar, and its config-driven
  # title/heading text — a broken component or config load would leave these absent even on
  # a 200 response.
  assert_file_contains "$dir/dist/index.html" 'data-component="Navbar"' || return 1
  assert_file_contains "$dir/dist/index.html" "Walle Design System" || return 1

  http_expect_200 "http://127.0.0.1:4501/" "$dir" "$(astro_bin "$dir")" preview --host 127.0.0.1 --port 4501
}
