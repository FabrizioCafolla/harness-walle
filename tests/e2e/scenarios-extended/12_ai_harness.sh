#!/usr/bin/env bash
# Scenario: the `ai` module generates a complete AGENTS.md (managed marker block with the walle
# CLI guide + a module map coherent with the active modules) and ships MANAGED walle skills under
# .claude/skills/@walle/. An update re-syncs both while leaving consumer-owned content intact.

scenario_ai_harness() {
  local dir="${SANDBOX_DIR}/aiharness"

  cli init --source "$REPO_ROOT" -n aiharness -m website,ai -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed" || return 1

  # AGENTS.md generated with the managed marker block and the complete guide.
  assert_path_present "$dir/AGENTS.md" || return 1
  assert_file_contains "$dir/AGENTS.md" "[walle:START]" || return 1
  assert_file_contains "$dir/AGENTS.md" "[walle:END]" || return 1
  assert_file_contains "$dir/AGENTS.md" "Active walle modules" || return 1
  assert_file_contains "$dir/AGENTS.md" "just walle-update" || return 1

  # Module map coherent with the active modules: website + ai present, backend absent.
  assert_file_contains "$dir/AGENTS.md" "**website**" || return 1
  assert_file_contains "$dir/AGENTS.md" "**ai**" || return 1
  if grep -qF "**backend**" "$dir/AGENTS.md"; then
    fail "AGENTS.md lists the inactive module backend"
    return 1
  fi

  # MANAGED walle skills synced.
  assert_path_present "$dir/.claude/skills/@walle/walle-update/SKILL.md" || return 1
  assert_path_present "$dir/.claude/skills/@walle/walle-customize/SKILL.md" || return 1

  # Consumer-owned content: a note outside the markers and a non-@walle skill must survive update;
  # a tampered managed skill must be restored.
  printf '\n## Consumer AI notes (must survive)\n' >>"$dir/AGENTS.md"
  mkdir -p "$dir/.claude/skills/my-skill"
  printf -- '---\nname: my-skill\n---\nconsumer skill\n' >"$dir/.claude/skills/my-skill/SKILL.md"
  printf '\nTAMPERED-BY-CONSUMER\n' >>"$dir/.claude/skills/@walle/walle-update/SKILL.md"

  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || fail "cli update failed" || return 1

  # Note outside the markers preserved; non-@walle skill preserved.
  assert_file_contains "$dir/AGENTS.md" "Consumer AI notes (must survive)" || return 1
  assert_path_present "$dir/.claude/skills/my-skill/SKILL.md" || return 1
  # Managed skill re-synced (consumer tamper overwritten).
  if grep -qF "TAMPERED-BY-CONSUMER" "$dir/.claude/skills/@walle/walle-update/SKILL.md"; then
    fail "managed walle skill was not re-synced on update"
    return 1
  fi

  # A consumer with a different module set describes its own modules in the managed block.
  local dir2="${SANDBOX_DIR}/aiharness2"
  cli init --source "$REPO_ROOT" -n aiharness2 -m website,backend,ai -d "$SANDBOX_DIR" >/dev/null || fail "cli init (backend) failed" || return 1
  assert_file_contains "$dir2/AGENTS.md" "**backend**" || return 1
}
