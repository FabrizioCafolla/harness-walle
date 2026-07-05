#!/usr/bin/env bash
# Scenario: fresh init creates .vscode/settings.json and extensions.json containing the walle
# marker block; a consumer's own settings outside the block survive a subsequent update.

scenario_vscode_inject() {
  local dir="${SANDBOX_DIR}/vscode"

  cli init --source "$REPO_ROOT" -n vscode -m website -d "$SANDBOX_DIR" >/dev/null || { fail "init failed"; return 1; }

  assert_path_present "$dir/.vscode/settings.json" || return 1
  assert_path_present "$dir/.vscode/extensions.json" || return 1
  assert_file_contains "$dir/.vscode/settings.json" 'esbenp.prettier-vscode' || return 1
  assert_file_contains "$dir/.vscode/extensions.json" 'astro-build.astro-vscode' || return 1

  # Consumer adds their own setting outside the block.
  node -e "
    const fs = require('fs');
    const p = '$dir/.vscode/settings.json';
    const raw = fs.readFileSync(p, 'utf8');
    fs.writeFileSync(p, raw.replace('{', '{\n  \"myOwnSetting\": true,'));
  " || { fail "failed to seed consumer setting"; return 1; }

  cli update --source "$REPO_ROOT" -p "$dir" >/dev/null || { fail "update failed"; return 1; }

  assert_file_contains "$dir/.vscode/settings.json" '"myOwnSetting": true' || return 1
  assert_file_contains "$dir/.vscode/settings.json" 'esbenp.prettier-vscode' || return 1

  node -e "
    const fs = require('fs');
    const raw = fs.readFileSync('$dir/.vscode/settings.json', 'utf8');
    const stripped = raw.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
    JSON.parse(stripped);
  " || { fail "settings.json (minus // comments) is not valid JSON"; return 1; }
}
