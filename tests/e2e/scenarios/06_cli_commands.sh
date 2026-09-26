#!/usr/bin/env bash
# Scenario: CLI v2 commands: dry-run (no-op), add <module>, and check, exercised via --source.

scenario_cli_commands() {
  local dir="${SANDBOX_DIR}/cli"

  cli init --source "$REPO_ROOT" -n cli -m website -d "$SANDBOX_DIR" >/dev/null || fail "init failed"
  sandbox_install "$dir" || { fail "install failed"; return 1; }

  # (a) update --dry-run from the same source changes nothing.
  local before after
  before="$(tree_checksum "$dir")"
  cli update --source "$REPO_ROOT" -p "$dir" --dry-run >/dev/null || { fail "dry-run update failed"; return 1; }
  after="$(tree_checksum "$dir")"
  [ "$before" = "$after" ] || { fail "dry-run modified files"; return 1; }

  # (a2) a flat docs page from the old layout is planned for removal by --dry-run (file kept),
  # and removed by the real update.
  echo old >"$dir/.harness-walle/docs/cli.md"
  local plan
  plan="$(cli update --source "$REPO_ROOT" -p "$dir" --dry-run 2>&1)" || { fail "dry-run update failed"; return 1; }
  echo "$plan" | grep -qF ".harness-walle/docs/cli.md" || { fail "dry-run does not plan removing the legacy docs page"; return 1; }
  assert_path_present "$dir/.harness-walle/docs/cli.md" || return 1
  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || { fail "update failed"; return 1; }
  assert_path_absent "$dir/.harness-walle/docs/cli.md" || return 1

  # (b) add ci syncs the module's paths and records it in the manifest.
  cli add ci --source "$REPO_ROOT" -p "$dir" >/dev/null || { fail "add ci failed"; return 1; }
  assert_path_present "$dir/.github/workflows/actions/@walle" || return 1
  node -e "process.exit(require('$dir/.harness-walle/manifest.json').modules.includes('ci')?0:1)" ||
    { fail "ci not recorded in manifest"; return 1; }

  # (c) check passes on a conformant consumer.
  cli check -p "$dir" >/dev/null 2>&1 || { fail "check failed on a conformant consumer"; return 1; }

  # (c2) add backend warns while astro.adapter is not "node", and stops warning once it is.
  local out
  out="$(cli add backend --source "$REPO_ROOT" -p "$dir" 2>&1)" || { fail "add backend failed"; return 1; }
  echo "$out" | grep -qF 'astro.adapter' || { fail "add backend should warn about the node adapter"; return 1; }
  node -e "
    const fs = require('fs'), p = '$dir/src/configs/app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.astro.adapter = 'node';
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  " || { fail "could not set astro.adapter"; return 1; }
  out="$(cli add backend --source "$REPO_ROOT" -p "$dir" 2>&1)" || { fail "re-add backend failed"; return 1; }
  if echo "$out" | grep -qF 'requires astro.adapter'; then
    fail "add backend still warns with astro.adapter set to node"
    return 1
  fi

  # (d) check fails on a v1 manifest.
  local v1="${SANDBOX_DIR}/cli-v1"
  mkdir -p "$v1/.harness-walle"
  printf '{"name":"old","walleVersion":"abc123","updatedAt":"2026-01-01T00:00:00Z"}\n' >"$v1/.harness-walle/manifest.json"
  if cli check -p "$v1" >/dev/null 2>&1; then
    fail "check should fail on a v1 manifest"
    return 1
  fi
}
