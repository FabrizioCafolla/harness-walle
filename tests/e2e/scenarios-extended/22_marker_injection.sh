#!/usr/bin/env bash
# Scenario: inject_marker_block() (cli.sh) is the single generalized non-destructive merge
# mechanism reused by AGENTS.md, the devcontainer .project files, and justfile.project. Exercise
# its three behaviors directly (not through a full init/update, which only reaches the AGENTS.md
# caller) plus syntactic-validity checks for bash and YAML block content, run in a subshell so
# cli.sh's `set -Ee`/ERR trap never leaks into the parent e2e harness process.

scenario_marker_injection() {
  local dir="${SANDBOX_DIR}/marker_injection"
  rm -rf "$dir"
  mkdir -p "$dir"

  local out
  out="$(bash <<EOF
set -uo pipefail
source "${REPO_ROOT}/walle/cli/cli.sh"
# cli.sh installs a global EXIT trap (cleans TEMP_DIR on real CLI runs) that would otherwise
# fire on this subshell's own exit, referencing an unbound \${BASH_SOURCE[0]} at top level.
trap - EXIT

start="<!-- [test:START] -->"
end="<!-- [test:END] -->"

fail_case() { echo "FAIL: \$1"; exit 1; }

# 1. create-from-nothing
block1="\$(mktemp)"
echo "line-one" >"\$block1"
inject_marker_block "${dir}/created.txt" "\$block1" "\$start" "\$end"
[ -f "${dir}/created.txt" ] || fail_case "file not created"
grep -qF "line-one" "${dir}/created.txt" || fail_case "block content missing on create"
grep -qF "\$start" "${dir}/created.txt" || fail_case "start marker missing on create"

# 2. append-to-existing (no markers yet)
printf 'existing consumer content\n' >"${dir}/appended.txt"
block2="\$(mktemp)"
echo "appended-line" >"\$block2"
inject_marker_block "${dir}/appended.txt" "\$block2" "\$start" "\$end"
grep -qF "existing consumer content" "${dir}/appended.txt" || fail_case "existing content lost on append"
grep -qF "appended-line" "${dir}/appended.txt" || fail_case "block not appended"

# 3. rewrite-between-markers (idempotent, preserves content outside markers)
block3a="\$(mktemp)"; echo "v1" >"\$block3a"
inject_marker_block "${dir}/rewrite.txt" "\$block3a" "\$start" "\$end"
echo "trailer owned by consumer" >>"${dir}/rewrite.txt"
block3b="\$(mktemp)"; echo "v2" >"\$block3b"
inject_marker_block "${dir}/rewrite.txt" "\$block3b" "\$start" "\$end"
grep -qF "v2" "${dir}/rewrite.txt" || fail_case "block not rewritten"
grep -qF "v1" "${dir}/rewrite.txt" && fail_case "stale block content not replaced"
grep -qF "trailer owned by consumer" "${dir}/rewrite.txt" || fail_case "content outside markers lost on rewrite"
# idempotent: re-injecting the same block content changes nothing outside the markers
before="\$(sha256sum "${dir}/rewrite.txt")"
inject_marker_block "${dir}/rewrite.txt" "\$block3b" "\$start" "\$end"
after="\$(sha256sum "${dir}/rewrite.txt")"
[ "\$before" = "\$after" ] || fail_case "re-injecting identical block content is not idempotent"

# 4. bash content stays syntactically valid after injection — markers must be shell-comment
# syntax (# ...), not the HTML markers used for Markdown, or the block breaks bash parsing.
bash_start="# [test:START]"
bash_end="# [test:END]"
blockbash="\$(mktemp)"
cat >"\$blockbash" <<'BASH'
corepack enable
yarn install --immutable
BASH
echo "#!/usr/bin/env bash" >"${dir}/setup.sh"
inject_marker_block "${dir}/setup.sh" "\$blockbash" "\$bash_start" "\$bash_end"
bash -n "${dir}/setup.sh" || fail_case "injected bash block is not syntactically valid"

# 5. YAML content stays parseable after injection (top-level key, no nested merge) — markers
# must be YAML-comment syntax (# ...), not HTML markers, or the block breaks YAML parsing.
yaml_start="# [test:START]"
yaml_end="# [test:END]"
cat >"${dir}/compose.yml" <<'YAML'
services:
  devcontainer:
    image: base
YAML
blockyaml="\$(mktemp)"
cat >"\$blockyaml" <<'YAML'
    labels:
      - "walle=true"
YAML
inject_marker_block "${dir}/compose.yml" "\$blockyaml" "\$yaml_start" "\$yaml_end"

echo OK
EOF
)"
  local rc=$?
  if [ "$rc" -ne 0 ] || [ "${out##*$'\n'}" != "OK" ]; then
    fail "marker injection subshell failed: ${out}"
    return 1
  fi

  yq eval '.' "${dir}/compose.yml" >/dev/null 2>&1 || fail "injected YAML block is not parseable" || return 1
}
