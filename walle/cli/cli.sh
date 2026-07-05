#!/usr/bin/env bash
#
# Walle CLI. Scaffolds/updates a consumer from the curated template/ and syncs the declared
# modules' @walle paths. Supports --dry-run, `add <module>`, and `walle check`.

set -Ee
set -u
set -o pipefail
set -o functrace

# =============================================================================
# 1. GLOBAL STATE & CONFIGURATIONS
# =============================================================================

GITHUB_WALLE_REPO="https://github.com/FabrizioCafolla/harness-walle"

# Markers
WALLE_START="<!-- [walle:START] -->"
WALLE_END="<!-- [walle:END] -->"
WALLE_START_SH="# [walle:START]"
WALLE_END_SH="# [walle:END]"
WALLE_START_JS="// [walle:START]"
WALLE_END_JS="// [walle:END]"

# Execution State
INTENTIONAL_EXIT=0
DRY_RUN=0
ASSUME_YES=0
SEED_ENABLED=0
HARNESS_CODING_ENABLED=1
AGENTS_MODULES=""
TEMP_DIR=""

# Error Handling Trap
trap 'catch_error $? $LINENO ${BASH_SOURCE[0]}' EXIT
catch_error() {
  local exit_code=$1
  local line_no=$2
  local file_name=$3
  if [ "$exit_code" != "0" ] && [ "${INTENTIONAL_EXIT}" != "1" ]; then
    echo "[ERROR] in $(basename "$file_name") at line $line_no (error code $exit_code)"
  fi
  if [ -n "${TEMP_DIR:-}" ] && [ -d "${TEMP_DIR}" ]; then
    rm -rf "${TEMP_DIR}"
  fi
}

# =============================================================================
# 2. LOGGING & UTILITIES
# =============================================================================

print_info()  { echo -e " [INFO] ${*}"; }
print_warn()  { echo -e " [WARN] ${*}"; }
print_plan()  { echo -e " [PLAN] ${*}"; }
print_error() {
  echo -e " [ERROR] ${*}"
  INTENTIONAL_EXIT=1
  exit 1
}

usage() {
  cat <<EOF
Usage: cli.sh <command> [options]

Commands:
  init      Scaffold a new consumer, or adopt an existing directory
  update    Re-sync the declared modules of an existing consumer
  add       Add a module to an existing consumer and sync it
  check     Validate a consumer (manifest, version pin, configs)

Common options:
  -s, --source <path>         Use a local walle clone instead of a release
  -w, --walle-version <tag>   Release tag (e.g. v0.1.0-beta). Default: latest
      --dry-run               Show the sync plan without writing anything
      --yes                   Skip confirmation prompts
      --no-harness-coding     Skip .devcontainer/ scaffold at init
  -h, --help                  Show this help
EOF
}

# =============================================================================
# 3. DOMAIN: MODULES & CONTRACTS
# =============================================================================

validate_module() {
  case "$1" in
    website|ci|ai|backend|infrastructure|harness-coding|devcontainer) : ;;
    *) print_error "unknown module '$1'. Valid: website, ci, ai, backend, infrastructure, harness-coding" ;;
  esac
}

ssr_enabled() {
  node -e "try{const a=require('$1/src/configs/app.json');process.exit(a&&a.astro&&a.astro.ssr&&a.astro.ssr.enabled===true?0:1)}catch(e){process.exit(1)}" 2>/dev/null
}

module_managed_map() {
  case "$1" in
    website) echo "walle/website/src/@walle:src/@walle walle/website/schemas:schemas walle/cli:scripts/@walle" ;;
    ci) echo "walle/ci/managed:.github/workflows/actions/@walle" ;;
    ai) echo "walle/ai/managed/skills:.claude/skills/@walle" ;;
    *) echo "" ;;
  esac
}

module_managed_paths() {
  local pair dests=""
  for pair in $(module_managed_map "$1"); do
    dests="${dests}${dests:+ }${pair#*:}"
  done
  echo "$dests"
}

module_seed_paths() {
  case "$1" in
    ci) echo ".github/workflows/test.yml .github/workflows/deploy.yml" ;;
    backend) echo "src/pages/api/health.ts src/pages/api/echo.ts src/middleware.ts" ;;
    infrastructure) echo "infrastructure/main.tf infrastructure/variables.tf infrastructure/providers.tf infrastructure/outputs.tf infrastructure/README.md infrastructure/.gitignore" ;;
    harness-coding|devcontainer) echo "justfile.project .husky/pre-commit .husky/pre-push" ;;
    *) echo "" ;;
  esac
}

module_purpose() {
  case "$1" in
    website) echo "Astro site — @walle components, layouts, styles, config and CLI scripts" ;;
    ci) echo "GitHub Actions workflows (test + deploy) under @walle" ;;
    ai) echo "AI harness — generated AGENTS.md block and @walle skills" ;;
    backend) echo "API routes (requires SSR enabled in src/configs/app.json)" ;;
    infrastructure) echo "Terraform infrastructure under infrastructure/" ;;
    harness-coding|devcontainer) echo "Harness coding scaffold" ;;
    *) echo "walle module" ;;
  esac
}

# =============================================================================
# 4. RESOLUTION: VERSIONS & SOURCE
# =============================================================================

resolve_latest_tag() {
  local tags
  tags="$(git ls-remote --tags --refs "$GITHUB_WALLE_REPO" 2>/dev/null |
    sed -n 's#.*refs/tags/\(v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*[-a-zA-Z0-9.]*\)$#\1#p' | sort -V)"
  [ -n "$tags" ] || return 0

  local stable
  stable="$(printf '%s\n' "$tags" | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | tail -1)"
  if [ -n "$stable" ]; then
    printf '%s\n' "$stable"
  else
    printf '%s\n' "$tags" | tail -1
  fi
}

major_of() {
  case "$1" in
    v[0-9]*) echo "${1#v}" | cut -d. -f1 ;;
    *) echo "" ;;
  esac
}

check_major_jump() {
  local cm tm
  cm="$(major_of "$1")"
  tm="$(major_of "$2")"
  [ -n "$cm" ] && [ -n "$tm" ] || return 0

  if [ "$tm" -gt "$cm" ]; then
    if [ "$ASSUME_YES" = "1" ]; then
      print_warn "Crossing a MAJOR boundary ($1 -> $2). Review CHANGELOG.md."
    else
      print_error "Update $1 -> $2 crosses a MAJOR boundary. Review CHANGELOG.md, use --yes to proceed."
    fi
  fi
}

resolve_source() {
  local source_path="$1" version="$2"
  if [ -n "$source_path" ]; then
    [ -d "$source_path" ] || print_error "source path does not exist: ${source_path}"
    SOURCE_DIR="$(cd "$source_path" && pwd)"
    WALLE_VERSION="local"
    SOURCE_REF="$SOURCE_DIR"
    print_warn "Using local source ${SOURCE_DIR}: this project is NOT on a tagged release."
  else
    if [ -z "$version" ]; then
      version="$(resolve_latest_tag)"
      [ -n "$version" ] || print_error "no published release tags found."
      print_info "Resolved latest release tag: ${version}"
    fi
    TEMP_DIR="$(mktemp -d)"
    git clone --depth 1 -b "$version" "$GITHUB_WALLE_REPO" "$TEMP_DIR" &>/dev/null ||
      print_error "failed to clone ${GITHUB_WALLE_REPO} at ${version}"
    SOURCE_DIR="$TEMP_DIR"
    WALLE_VERSION="$version"
    SOURCE_REF=""
  fi
}

# =============================================================================
# 5. FILE SYNC & MANIPULATION PRIMITIVES
# =============================================================================

sync_path() {
  local src="$1" dst="$2"
  if [ -d "$src" ]; then
    rm -rf "$dst"
    mkdir -p "$(dirname "$dst")"
    cp -r "$src" "$dst"
  elif [ -f "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
  fi
}

plan_path() {
  local src="$1" dst="$2" f rel
  [ -e "$src" ] || return 0
  if [ -d "$src" ]; then
    while IFS= read -r f; do
      rel="${f#"$src"/}"
      if [ ! -e "${dst}/${rel}" ]; then print_plan "+ ${dst}/${rel}"
      elif ! cmp -s "$f" "${dst}/${rel}"; then print_plan "~ ${dst}/${rel}"; fi
    done < <(find "$src" -type f)
    if [ -d "$dst" ]; then
      while IFS= read -r f; do
        rel="${f#"$dst"/}"
        case "$f" in *@walle/LICENSE) continue ;; esac
        [ -e "${src}/${rel}" ] || print_plan "- ${f}"
      done < <(find "$dst" -type f)
    fi
  elif [ -f "$src" ]; then
    if [ ! -e "$dst" ]; then print_plan "+ ${dst}"
    elif ! cmp -s "$src" "$dst"; then print_plan "~ ${dst}"; fi
  fi
}

seed_path() {
  local src="$1" dst="$2"
  [ -e "$src" ] || return 0
  [ -e "$dst" ] && return 0
  mkdir -p "$(dirname "$dst")"
  if [ -d "$src" ]; then cp -r "$src" "$dst"
  else cp "$src" "$dst"; fi
}

plan_seed_path() {
  local src="$1" dst="$2"
  [ -e "$src" ] || return 0
  [ -e "$dst" ] && return 0
  print_plan "+ ${dst} (seed, once)"
}

inject_marker_block() {
  local target_path="$1" block_file="$2" start_marker="$3" end_marker="$4"
  if [ -f "$target_path" ] && grep -qF "$start_marker" "$target_path" && grep -qF "$end_marker" "$target_path"; then
    awk -v start="$start_marker" -v end="$end_marker" -v block="$block_file" '
      $0 == start { print; while ((getline line < block) > 0) print line; skip=1; next }
      $0 == end { print; skip=0; next }
      skip != 1 { print }
    ' "$target_path" >"${target_path}.tmp"
    mv "${target_path}.tmp" "$target_path"
  else
    mkdir -p "$(dirname "$target_path")"
    {
      [ -s "$target_path" ] && echo ""
      echo "$start_marker"
      cat "$block_file"
      echo "$end_marker"
    } >>"$target_path"
  fi
}

plan_inject_marker_block() {
  local target_path="$1" block_file="$2" start_marker="$3" end_marker="$4"
  if [ ! -f "$target_path" ] || ! grep -qF "$start_marker" "$target_path"; then
    print_plan "+ ${target_path} (walle marker block appended)"
    return 0
  fi
  local current
  current="$(awk -v s="$start_marker" -v e="$end_marker" '$0==s{f=1;next} $0==e{f=0} f' "$target_path")"
  if ! diff -q <(printf '%s\n' "$current") "$block_file" >/dev/null 2>&1; then
    print_plan "~ ${target_path} (walle marker block content)"
  fi
}

ensure_json_object_markers() {
  local target="$1"
  if [ ! -f "$target" ]; then
    mkdir -p "$(dirname "$target")"
    printf '{\n%s\n%s\n}\n' "$WALLE_START_JS" "$WALLE_END_JS" >"$target"
    return 0
  fi
  grep -qF "$WALLE_START_JS" "$target" && return 0
  WALLE_JSON_TARGET="$target" WALLE_JSON_START="$WALLE_START_JS" WALLE_JSON_END="$WALLE_END_JS" node -e '
    const fs = require("fs");
    const path = process.env.WALLE_JSON_TARGET;
    const start = process.env.WALLE_JSON_START;
    const end = process.env.WALLE_JSON_END;
    let raw = fs.readFileSync(path, "utf8");
    const idx = raw.lastIndexOf("}");
    if (idx === -1) throw new Error("not a JSON object: " + path);
    let before = raw.slice(0, idx).replace(/\s+$/, "");
    const after = raw.slice(idx);
    const needsComma = /[^{,\s]$/.test(before);
    before = before + (needsComma ? "," : "") + "\n" + start + "\n" + end + "\n";
    fs.writeFileSync(path, before + after);
  '
}

ensure_json_array_markers() {
  local target="$1" array_key="$2"
  if [ ! -f "$target" ]; then
    mkdir -p "$(dirname "$target")"
    printf '{\n  "%s": [\n%s\n%s\n  ]\n}\n' "$array_key" "$WALLE_START_JS" "$WALLE_END_JS" >"$target"
    return 0
  fi
  grep -qF "$WALLE_START_JS" "$target" && return 0
  WALLE_JSON_TARGET="$target" WALLE_JSON_KEY="$array_key" WALLE_JSON_START="$WALLE_START_JS" WALLE_JSON_END="$WALLE_END_JS" node -e '
    const fs = require("fs");
    const path = process.env.WALLE_JSON_TARGET;
    const key = process.env.WALLE_JSON_KEY;
    const start = process.env.WALLE_JSON_START;
    const end = process.env.WALLE_JSON_END;
    let raw = fs.readFileSync(path, "utf8");
    const keyIdx = raw.indexOf(`"${key}"`);
    if (keyIdx === -1) {
      const idx = raw.lastIndexOf("}");
      let before = raw.slice(0, idx).replace(/\s+$/, "");
      const after = raw.slice(idx);
      const needsComma = /[^{,\s]$/.test(before);
      before = before + (needsComma ? "," : "") + `\n  "${key}": [\n${start}\n${end}\n  ]\n`;
      fs.writeFileSync(path, before + after);
      return;
    }
    const arrOpen = raw.indexOf("[", keyIdx);
    const arrClose = raw.indexOf("]", arrOpen);
    let before = raw.slice(0, arrClose).replace(/\s+$/, "");
    const after = raw.slice(arrClose);
    const needsComma = /[^\[,\s]$/.test(before);
    before = before + (needsComma ? "," : "") + `\n${start}\n${end}\n  `;
    fs.writeFileSync(path, before + after);
  '
}

# =============================================================================
# 6. DOMAIN SYNCING LOGIC
# =============================================================================

seed_template() {
  local src_dir="$1" tgt_dir="$2"
  local tpl_root="${src_dir}/walle/template"
  local f rel

  while IFS= read -r f; do
    rel="${f#"$tpl_root"/}"

    if [ "$DRY_RUN" = "1" ]; then
      plan_seed_path "$f" "${tgt_dir}/${rel}"
    else
      seed_path "$f" "${tgt_dir}/${rel}"
    fi
  done < <(find "$tpl_root" -type f)
}

sync_devcontainer() {
  local src_dir="$1" tgt_dir="$2"
  [ "$HARNESS_CODING_ENABLED" = "1" ] || return 0

  if [ ! -d "${tgt_dir}/.devcontainer" ]; then
    print_warn "no .devcontainer/ found at ${tgt_dir}. Run harness-coding first."
  fi

  local setup_tgt="${tgt_dir}/.devcontainer/scripts/setup-devcontainer.project.sh"
  local compose_tgt="${tgt_dir}/.devcontainer/docker-compose.project.yml"
  local setup_blk="${src_dir}/walle/harness-coding/inject/setup-devcontainer.project.block.sh"
  local compose_blk="${src_dir}/walle/harness-coding/inject/docker-compose.project.block.yml"

  if [ "$DRY_RUN" = "1" ]; then
    plan_inject_marker_block "$setup_tgt" "$setup_blk" "$WALLE_START_SH" "$WALLE_END_SH"
    plan_inject_marker_block "$compose_tgt" "$compose_blk" "$WALLE_START_SH" "$WALLE_END_SH"
  else
    inject_marker_block "$setup_tgt" "$setup_blk" "$WALLE_START_SH" "$WALLE_END_SH"
    inject_marker_block "$compose_tgt" "$compose_blk" "$WALLE_START_SH" "$WALLE_END_SH"
  fi
}

seed_devcontainer() {
  local src_dir="$1" tgt_dir="$2"
  [ "$HARNESS_CODING_ENABLED" = "1" ] || return 0
  for rel in $(module_seed_paths "devcontainer"); do
    if [ "$DRY_RUN" = "1" ]; then
      # Modificato per mappare il percorso reale "walle/harness-coding/seed/"
      plan_seed_path "${src_dir}/walle/harness-coding/seed/${rel}" "${tgt_dir}/${rel}"
    else
      seed_path "${src_dir}/walle/harness-coding/seed/${rel}" "${tgt_dir}/${rel}"
    fi
  done
}

generate_agents_block() {
  local src_dir="$1"
  local preamble="${src_dir}/walle/cli/agents.block.md"
  [ -f "$preamble" ] || print_error "missing AGENTS preamble source: ${preamble}"

  cat "$preamble"
  echo -e "\n### Active walle modules\n"

  for m in ${AGENTS_MODULES}; do
    echo "- **${m}** — $(module_purpose "$m")"
    local managed seed
    managed="$(module_managed_paths "$m")"
    seed="$(module_seed_paths "$m")"
    [ -n "$managed" ] && echo "  - Managed: $(echo "$managed" | sed 's/ /, /g')"
    [ -n "$seed" ] && echo "  - Seeded once: $(echo "$seed" | sed 's/ /, /g')"
  done

  if [ "${HARNESS_CODING_ENABLED:-0}" = "1" ]; then
    echo "- **harness-coding** — $(module_purpose "devcontainer")"
    local m_dc s_dc
    m_dc="$(module_managed_paths "devcontainer")"
    s_dc="$(module_seed_paths "devcontainer")"
    [ -n "$m_dc" ] && echo "  - Managed: $(echo "$m_dc" | sed 's/ /, /g')"
    [ -n "$s_dc" ] && echo "  - Seeded once: $(echo "$s_dc" | sed 's/ /, /g')"
  fi

  echo -e "\n### Working with walle\n"
  echo "- Managed \`@walle/\` zones are regenerated by the CLI."
  echo "- Update: \`just walle-update\`."
  echo "- Add: \`just walle add <module>\`."
  echo "- Validate: \`just walle-check\`."
}

sync_agents_marker() {
  local src_dir="$1" tgt_dir="$2"
  local block_file
  block_file="$(mktemp)"
  generate_agents_block "$src_dir" >"$block_file"

  if [ "$DRY_RUN" = "1" ]; then
    plan_inject_marker_block "${tgt_dir}/AGENTS.md" "$block_file" "$WALLE_START" "$WALLE_END"
  else
    inject_marker_block "${tgt_dir}/AGENTS.md" "$block_file" "$WALLE_START" "$WALLE_END"
    print_info "AGENTS.md walle block synced."
  fi
  rm -f "$block_file"
}

sync_managed_map() {
  local src_dir="$1" tgt_dir="$2" module="$3"
  for pair in $(module_managed_map "$module"); do
    local src="${pair%%:*}" dest="${pair#*:}"
    if [ "$DRY_RUN" = "1" ]; then
      plan_path "${src_dir}/${src}" "${tgt_dir}/${dest}"
    else
      sync_path "${src_dir}/${src}" "${tgt_dir}/${dest}"
      if [ -d "${tgt_dir}/${dest}" ] && [[ "$dest" == *"@walle"* ]] && [ -f "${src_dir}/LICENSE" ]; then
        cp "${src_dir}/LICENSE" "${tgt_dir}/${dest}/LICENSE"
      fi
    fi
  done
}

sync_website_justfile() {
  local src_dir="$1" tgt_dir="$2"
  local tgt="${tgt_dir}/justfile.project"
  local blk="${src_dir}/walle/harness-coding/inject/justfile.project.block"
  local old="${tgt_dir}/walle.justfile"
  local imp="import 'walle.justfile'"

  if [ "$DRY_RUN" = "1" ]; then
    [ -f "$old" ] && print_plan "- ${old} (migrated to injected block)"
    [ -f "$tgt" ] && grep -qF "$imp" "$tgt" && print_plan "~ ${tgt} (remove legacy import)"
    plan_inject_marker_block "$tgt" "$blk" "$WALLE_START_SH" "$WALLE_END_SH"
    return 0
  fi

  if [ -f "$old" ]; then rm -f "$old"; print_info "removed legacy walle.justfile."; fi
  if [ -f "$tgt" ] && grep -qF "$imp" "$tgt"; then
    sed -i.bak "\#^${imp}\$#d" "$tgt" && rm -f "${tgt}.bak"
  fi
  inject_marker_block "$tgt" "$blk" "$WALLE_START_SH" "$WALLE_END_SH"
}

sync_vscode_inject() {
  local src_dir="$1" tgt_dir="$2"
  local s_tgt="${tgt_dir}/.vscode/settings.json"
  local e_tgt="${tgt_dir}/.vscode/extensions.json"
  local s_blk="${src_dir}/walle/harness-coding/inject/vscode-settings.block.json"
  local e_blk="${src_dir}/walle/harness-coding/inject/vscode-extensions.block.json"

  if [ "$DRY_RUN" != "1" ]; then
    ensure_json_object_markers "$s_tgt"
    ensure_json_array_markers "$e_tgt" "recommendations"
    inject_marker_block "$s_tgt" "$s_blk" "$WALLE_START_JS" "$WALLE_END_JS"
    inject_marker_block "$e_tgt" "$e_blk" "$WALLE_START_JS" "$WALLE_END_JS"
  else
    plan_inject_marker_block "$s_tgt" "$s_blk" "$WALLE_START_JS" "$WALLE_END_JS"
    plan_inject_marker_block "$e_tgt" "$e_blk" "$WALLE_START_JS" "$WALLE_END_JS"
  fi
}

sync_module() {
  local src_dir="$1" tgt_dir="$2" mod="$3"
  sync_managed_map "$src_dir" "$tgt_dir" "$mod"

  if [ "$SEED_ENABLED" = "1" ]; then
    for rel in $(module_seed_paths "$mod"); do
      if [ "$DRY_RUN" = "1" ]; then plan_seed_path "${src_dir}/walle/${mod}/seed/${rel}" "${tgt_dir}/${rel}"
      else seed_path "${src_dir}/walle/${mod}/seed/${rel}" "${tgt_dir}/${rel}"; fi
    done
  fi

  [ "$mod" = "ai" ] && sync_agents_marker "$src_dir" "$tgt_dir"
  if [ "$mod" = "website" ]; then
    sync_website_justfile "$src_dir" "$tgt_dir"
    sync_vscode_inject "$src_dir" "$tgt_dir"
  fi
  [ "$DRY_RUN" = "1" ] || print_info "Module '${mod}' synced."
}

run_init_sync() {
  local src_dir="$1" tgt_dir="$2"; shift 2
  local mods=("$@")
  seed_template "$src_dir" "$tgt_dir"
  for m in "${mods[@]}"; do sync_module "$src_dir" "$tgt_dir" "$m"; done
  sync_devcontainer "$src_dir" "$tgt_dir"
  seed_devcontainer "$src_dir" "$tgt_dir"
}

# =============================================================================
# 7. MANIFEST & CONFIGURATIONS
# =============================================================================

write_manifest() {
  local tgt_dir="$1" name="$2"; shift 2
  local mods=("$@") mods_json="" sep=""

  for m in "${mods[@]}"; do
    mods_json="${mods_json}${sep}\"${m}\""
    sep=", "
  done

  local ref_line=""
  [ -n "${SOURCE_REF}" ] && ref_line="  \"sourceRef\": \"${SOURCE_REF}\","$'\n'
  local dc_val=$([ "$HARNESS_CODING_ENABLED" = "1" ] && echo true || echo false)

  mkdir -p "${tgt_dir}/.walle"
  cat >"${tgt_dir}/.walle/manifest.json" <<EOF
{
  "\$schema": "../schemas/walle.config.schema.json",
  "schemaVersion": 2,
  "name": "${name}",
  "walleVersion": "${WALLE_VERSION}",
${ref_line}  "modules": [${mods_json}],
  "devcontainer": { "enabled": ${dc_val} },
  "updatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  print_info "Manifest written: ${tgt_dir}/.walle/manifest.json"
}

write_lock() {
  mkdir -p "${1}/.walle"
  printf '%s\n' "${SOURCE_REF:-$WALLE_VERSION}" >"${1}/.walle/lock"
}

write_walle_config_yml() {
  local tgt="${1}/.walle/config.yml"
  [ -f "$tgt" ] && return 0
  mkdir -p "${1}/.walle"
  echo "docs: true" > "$tgt"
}

walle_docs_enabled() {
  local cfg="${1}/.walle/config.yml"
  [ -f "$cfg" ] || return 0
  grep -Eq '^docs:[[:space:]]*false[[:space:]]*$' "$cfg" && return 1
  return 0
}

sync_walle_docs() {
  local src_dir="$1" tgt_dir="$2"
  walle_docs_enabled "$tgt_dir" || return 0
  for f in cli.md modules.md managed-vs-seed.md versioning.md; do
    if [ "$DRY_RUN" = "1" ]; then plan_path "${src_dir}/wiki/${f}" "${tgt_dir}/.walle/docs/${f}"
    else sync_path "${src_dir}/wiki/${f}" "${tgt_dir}/.walle/docs/${f}"; fi
  done
}

migrate_walle_config() {
  local old="${1}/.walle.config.json"
  [ -f "$old" ] || return 0
  mkdir -p "${1}/.walle"
  if [ "$DRY_RUN" = "1" ]; then
    print_plan "~ ${1}/.walle/manifest.json (migrated)"
    print_plan "- ${old}"
  else
    cp "$old" "${1}/.walle/manifest.json"
    rm -f "$old"
    print_info "migrated ${old} -> .walle/manifest.json"
  fi
}

manifest_field() {
  node -e "const m=require('$1');process.stdout.write(String(m['$2']??''))" 2>/dev/null || true
}

read_manifest() {
  local manifest="$1"
  [ -f "$manifest" ] || print_error "no .walle/manifest.json found at ${manifest}"

  local sv; sv="$(manifest_field "$manifest" schemaVersion)"
  [ "$sv" = "2" ] || print_error "manifest predates schemaVersion 2. No files changed."

  MF_NAME="$(manifest_field "$manifest" name)"
  MF_VERSION="$(manifest_field "$manifest" walleVersion)"
  MF_MODULES="$(node -e "const m=require('$manifest');process.stdout.write((m.modules||[]).join(' '))" 2>/dev/null)"

  [ -n "$MF_MODULES" ] || print_error "manifest declares no modules"
  MF_HARNESS_CODING_ENABLED="$(node -e "try{const m=require('$manifest');process.stdout.write(m.devcontainer?.enabled!==false?'1':'0')}catch(e){process.stdout.write('1')}" 2>/dev/null || echo "1")"
}

# =============================================================================
# 8. CLI COMMAND HANDLERS
# =============================================================================

cmd_init() {
  local PROJ_NAME="" DIR_PATH MODULES_CSV="website" SRC_PATH="" VER=""
  DIR_PATH="$(pwd)"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -n|--project-name)  PROJ_NAME="$2"; shift 2 ;;
      -d|--dir-path)      DIR_PATH="$2"; shift 2 ;;
      -m|--modules)       MODULES_CSV="$2"; shift 2 ;;
      -s|--source)        SRC_PATH="$2"; shift 2 ;;
      -w|--walle-version) VER="$2"; shift 2 ;;
      --dry-run)          DRY_RUN=1; shift ;;
      --yes)              ASSUME_YES=1; shift ;;
      --no-harness-coding)HARNESS_CODING_ENABLED=0; shift ;;
      -h|--help)          usage; exit 0 ;;
      *)                  usage; print_error "unknown option: $1" ;;
    esac
  done

  local _raw_mods; IFS=',' read -ra _raw_mods <<<"$MODULES_CSV"
  local mods=() has_web=0

  for m in "${_raw_mods[@]}"; do
    validate_module "$m"
    [ "$m" = "website" ] && has_web=1
    if [ "$m" = "devcontainer" ]; then HARNESS_CODING_ENABLED=1; continue; fi
    mods+=("$m")
  done

  [ "$has_web" = "1" ] || print_error "'website' is a mandatory module"

  AGENTS_MODULES="${mods[*]}"
  SEED_ENABLED=1
  resolve_source "$SRC_PATH" "$VER"

  local proj_dir
  if [ -n "$PROJ_NAME" ]; then proj_dir="${DIR_PATH%/}/${PROJ_NAME}"
  else proj_dir="${DIR_PATH%/}"; PROJ_NAME="$(basename "$proj_dir")"; fi

  local adopt=0
  if [ -e "$proj_dir" ]; then
    { [ -f "${proj_dir}/.walle/manifest.json" ] || [ -f "${proj_dir}/.walle.config.json" ]; } &&
      print_error "already a walle project. Use update or add."
    adopt=1
  fi

  if [ "$DRY_RUN" = "1" ]; then
    print_plan "init plan for '${PROJ_NAME}'"
    run_init_sync "$SOURCE_DIR" "$proj_dir" "${mods[@]}"
    sync_walle_docs "$SOURCE_DIR" "$proj_dir"
    print_info "Dry-run: no files written."
    return 0
  fi

  if [ "$adopt" = "1" ] && [ "$ASSUME_YES" != "1" ]; then
    print_warn "target directory exists. Proceed with adoption? [y/N] "
    read -r reply || true
    [[ ! "$reply" =~ ^[Yy](es)?$ ]] && print_error "aborted"
  fi

  mkdir -p "$proj_dir"
  print_info "Scaffolding ${PROJ_NAME}..."
  run_init_sync "$SOURCE_DIR" "$proj_dir" "${mods[@]}"
  write_manifest "$proj_dir" "$PROJ_NAME" "${mods[@]}"
  write_walle_config_yml "$proj_dir"
  sync_walle_docs "$SOURCE_DIR" "$proj_dir"
  write_lock "$proj_dir"
  print_info "Project ${PROJ_NAME} initialized."
}

cmd_update() {
  local PROJ_PATH SRC_PATH="" VER=""
  PROJ_PATH="$(pwd)"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -p|--project-path)  PROJ_PATH="$2"; shift 2 ;;
      -s|--source)        SRC_PATH="$2"; shift 2 ;;
      -w|--walle-version) VER="$2"; shift 2 ;;
      --dry-run)          DRY_RUN=1; shift ;;
      --yes)              ASSUME_YES=1; shift ;;
      -h|--help)          usage; exit 0 ;;
      *)                  usage; print_error "unknown option: $1" ;;
    esac
  done

  migrate_walle_config "$PROJ_PATH"
  local manifest="${PROJ_PATH}/.walle/manifest.json"
  [ -f "$manifest" ] || manifest="${PROJ_PATH}/.walle.config.json"

  read_manifest "$manifest"
  local mods; read -ra mods <<<"$MF_MODULES"
  for m in "${mods[@]}"; do validate_module "$m"; done

  AGENTS_MODULES="${mods[*]}"
  HARNESS_CODING_ENABLED="$MF_HARNESS_CODING_ENABLED"

  resolve_source "$SRC_PATH" "$VER"
  check_major_jump "$MF_VERSION" "$WALLE_VERSION"

  if [ "$DRY_RUN" = "1" ]; then
    print_plan "update plan for '${MF_NAME}' (${MF_VERSION} -> ${WALLE_VERSION})"
    for m in "${mods[@]}"; do sync_module "$SOURCE_DIR" "$PROJ_PATH" "$m"; done
    sync_devcontainer "$SOURCE_DIR" "$PROJ_PATH"
    seed_devcontainer "$SOURCE_DIR" "$PROJ_PATH"
    sync_walle_docs "$SOURCE_DIR" "$PROJ_PATH"
    return 0
  fi

  print_info "Updating ${MF_NAME}..."
  for m in "${mods[@]}"; do sync_module "$SOURCE_DIR" "$PROJ_PATH" "$m"; done
  sync_devcontainer "$SOURCE_DIR" "$PROJ_PATH"
  seed_devcontainer "$SOURCE_DIR" "$PROJ_PATH"
  write_manifest "$PROJ_PATH" "$MF_NAME" "${mods[@]}"
  write_walle_config_yml "$PROJ_PATH"
  sync_walle_docs "$SOURCE_DIR" "$PROJ_PATH"
  write_lock "$PROJ_PATH"
  print_info "Project updated."
}

cmd_add() {
  local PROJ_PATH SRC_PATH="" VER="" NEW_MOD=""
  PROJ_PATH="$(pwd)"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -p|--project-path)  PROJ_PATH="$2"; shift 2 ;;
      -s|--source)        SRC_PATH="$2"; shift 2 ;;
      -w|--walle-version) VER="$2"; shift 2 ;;
      --dry-run)          DRY_RUN=1; shift ;;
      -h|--help)          usage; exit 0 ;;
      -*)                 usage; print_error "unknown option: $1" ;;
      *)                  NEW_MOD="$1"; shift ;;
    esac
  done

  [ -n "$NEW_MOD" ] || print_error "module required"
  validate_module "$NEW_MOD"

  SEED_ENABLED=1
  read_manifest "${PROJ_PATH}/.walle/manifest.json"

  local mods; read -ra mods <<<"$MF_MODULES"
  HARNESS_CODING_ENABLED="$MF_HARNESS_CODING_ENABLED"
  resolve_source "$SRC_PATH" "$VER"

  if [ "$NEW_MOD" = "devcontainer" ]; then
    HARNESS_CODING_ENABLED=1
    if [ "$DRY_RUN" = "1" ]; then
      print_plan "add plan: devcontainer"
      return 0
    fi
    sync_devcontainer "$SOURCE_DIR" "$PROJ_PATH"
    seed_devcontainer "$SOURCE_DIR" "$PROJ_PATH"
    write_manifest "$PROJ_PATH" "$MF_NAME" "${mods[@]}"
    print_info "devcontainer added."
    return 0
  fi

  local present=0
  for m in "${mods[@]}"; do [ "$m" = "$NEW_MOD" ] && present=1; done
  [ "$present" = "1" ] && print_info "'${NEW_MOD}' already declared — re-syncing."

  if [ "$DRY_RUN" = "1" ]; then
    print_plan "add plan: '${NEW_MOD}'"
    return 0
  fi

  sync_module "$SOURCE_DIR" "$PROJ_PATH" "$NEW_MOD"
  [ "$present" = "1" ] || mods+=("$NEW_MOD")

  write_manifest "$PROJ_PATH" "$MF_NAME" "${mods[@]}"
  print_info "Module '${NEW_MOD}' added."

  if [ "$NEW_MOD" = "backend" ] && ! ssr_enabled "$PROJ_PATH"; then
    print_warn "backend requires SSR in src/configs/app.json"
  fi
}

cmd_check() {
  local PROJ_PATH SRC_PATH="" VERB=0
  PROJ_PATH="$(pwd)"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -p|--project-path) PROJ_PATH="$2"; shift 2 ;;
      -s|--source)       SRC_PATH="$2"; shift 2 ;;
      -v|--verbose)      VERB=1; shift ;;
      -h|--help)         usage; exit 0 ;;
      *)                 usage; print_error "unknown option: $1" ;;
    esac
  done

  local manifest="${PROJ_PATH}/.walle/manifest.json"
  read_manifest "$manifest"
  print_info "✓ manifest present (${MF_NAME})"

  case "$MF_VERSION" in
    local|v[0-9]*.[0-9]*.[0-9]*) print_info "✓ walleVersion pinned: ${MF_VERSION}" ;;
    *) print_error "walleVersion '${MF_VERSION}' invalid" ;;
  esac

  # Version Check
  if [ "$MF_VERSION" != "local" ]; then
    local _lat; _lat="$(resolve_latest_tag 2>/dev/null || true)"
    if [ -n "$_lat" ] && [ "$_lat" != "$MF_VERSION" ]; then
      print_warn "version ${MF_VERSION} pinned; latest published is ${_lat}"
    elif [ -n "$_lat" ]; then
      print_info "✓ version up to date"
    fi
  fi

  # Manifest Validation
  if [ -d "${PROJ_PATH}/node_modules/ajv" ]; then
    node -e "
      const Ajv=require('${PROJ_PATH}/node_modules/ajv').default||require('${PROJ_PATH}/node_modules/ajv');
      const af=require('${PROJ_PATH}/node_modules/ajv-formats').default||require('${PROJ_PATH}/node_modules/ajv-formats');
      const ajv=new Ajv({strict:false}); af(ajv);
      const v=ajv.compile(require('${PROJ_PATH}/schemas/walle.config.schema.json'));
      if(!v(require('${manifest}'))){console.error(v.errors);process.exit(1);}
    " || print_error "manifest failed validation"
    print_info "✓ manifest valid"
  else
    print_warn "skipping schema validation (missing ajv)"
  fi

  # SEED & Missing Checks
  for _m in $MF_MODULES; do
    for _r in $(module_seed_paths "$_m"); do
      [ -e "${PROJ_PATH}/${_r}" ] && print_info "· seed present: ${_r}" || print_info "· seed absent: ${_r}"
    done
  done

  if [ "$MF_HARNESS_CODING_ENABLED" = "1" ]; then
    for _r in $(module_seed_paths "devcontainer"); do
      [ -e "${PROJ_PATH}/${_r}" ] && print_info "· seed present: ${_r}" || print_warn "· seed missing: ${_r}"
    done
  fi

  print_info "check passed."
}

# =============================================================================
# 9. ENTRY POINT
# =============================================================================

main() {
  local cmd="" args=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      init|update|add|check) cmd="$1"; shift ;;
      -h|--help) usage; exit 0 ;;
      *) args+=("$1"); shift ;;
    esac
  done

  [ -n "$cmd" ] || { usage; print_error "no command given"; }

  "cmd_${cmd}" "${args[@]}"
}

if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi
