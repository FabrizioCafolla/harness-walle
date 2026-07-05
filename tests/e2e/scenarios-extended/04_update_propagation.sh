#!/usr/bin/env bash
# Scenario: update propagates @walle and marker-block mutations from a fixture source
# while leaving every consumer-zone file byte-identical; build + serve stay green.

# Checksum only the consumer zones (must be invariant across an update).
consumer_zone_checksum() {
  local dir="$1" p
  ( cd "$dir" && for p in \
      src/configs src/styles src/components src/pages src/content \
      astro.config.mjs package.json tsconfig.json justfile .vscode \
      .gitignore .nvmrc .prettierrc.json .prettierignore .yarnrc.yml; do
      [ -e "$p" ] || continue
      find "$p" -type f | LC_ALL=C sort | while read -r f; do
        printf '%s  %s\n' "$(sha256sum "$f" | cut -d' ' -f1)" "$f"
      done
    done )
}

scenario_update_propagation() {
  local dir="${SANDBOX_DIR}/custom" src="${SANDBOX_DIR}/.fixture-src"

  cli init --source "$REPO_ROOT" -n custom -m website,ci,ai -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed"

  # Customize consumer zones.
  printf '\n/* consumer override */\n:root { --primary: #123456; }\n' >>"$dir/src/styles/global.css"
  printf -- '---\n---\n<html><body><h1>custom consumer page</h1></body></html>\n' >"$dir/src/pages/custom.astro"
  node -e "const fs=require('fs');const p='$dir/src/configs/app.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.website.title='Customized';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');" \
    || fail "could not edit app.json" || return 1
  printf '\n## Consumer-only notes (must survive)\n' >>"$dir/AGENTS.md"

  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" || fail "build before update failed" || return 1

  local cz_before cz_after
  cz_before="$(consumer_zone_checksum "$dir")"

  # Build a mutated fixture source and mutate a @walle file + the marker block.
  make_source_subset "$src"
  printf '\n/* WALLE-MUTATION-MARKER */\n' >>"$src/src/@walle/styles/global.css"
  printf '\nMutated-by-fixture line.\n' >>"$src/walle/cli/agents.block.md"

  cli update --source "$src" -p "$dir" >/dev/null || fail "cli update failed" || return 1

  # @walle mutation propagated.
  assert_file_contains "$dir/src/@walle/styles/global.css" "WALLE-MUTATION-MARKER" || return 1
  # Marker block updated; consumer notes outside markers preserved.
  assert_file_contains "$dir/AGENTS.md" "Mutated-by-fixture line." || return 1
  assert_file_contains "$dir/AGENTS.md" "Consumer-only notes (must survive)" || return 1

  # Consumer zones byte-identical.
  cz_after="$(consumer_zone_checksum "$dir")"
  if [ "$cz_before" != "$cz_after" ]; then
    diff <(printf '%s\n' "$cz_before") <(printf '%s\n' "$cz_after")
    fail "consumer zones were modified by update"
    return 1
  fi

  # Build + serve still green after the update.
  sandbox_build "$dir" || fail "build after update failed" || return 1
  http_expect_200 "http://127.0.0.1:4503/" "$dir" "$(astro_bin "$dir")" preview --host 127.0.0.1 --port 4503
}
