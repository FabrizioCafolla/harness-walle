#!/usr/bin/env bash
# Shared helpers for the walle e2e harness. Sourced by run.sh and the scenarios.

# REPO_ROOT is the walle project root (parent of tests/e2e/).
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)"
SANDBOX_DIR="${REPO_ROOT}/tests/e2e/.sandbox"
CLI="${REPO_ROOT}/walle/cli/cli.sh"

# init runs harness-coding's CLI to establish the base. Point it at an offline stub so the
# suite never reaches the network — it creates the minimal base files walle injects into.
_HC_STUB="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.hc-stub.sh"
cat >"$_HC_STUB" <<'STUB'
#!/usr/bin/env bash
ws=""
while [ $# -gt 0 ]; do case "$1" in --workspace) ws="$2"; shift 2 ;; *) shift ;; esac; done
[ -n "$ws" ] || exit 0
mkdir -p "$ws/.devcontainer/scripts"
printf '#!/usr/bin/env bash\n' >"$ws/.devcontainer/scripts/setup-devcontainer.project.sh"
printf 'services:\n' >"$ws/.devcontainer/docker-compose.project.yml"
# Base justfile mirrors harness-coding: it imports the consumer's justfile.project where
# walle injects its recipes (walle-setup, dev, build, ...).
printf "import? 'justfile.project'\n\ndefault:\n    @just --list\n" >"$ws/justfile"
STUB
chmod +x "$_HC_STUB"
export WALLE_HARNESS_CODING_CLI="$_HC_STUB"

# --- logging -----------------------------------------------------------------

c_reset=$'\033[0m'; c_red=$'\033[31m'; c_grn=$'\033[32m'; c_ylw=$'\033[33m'; c_dim=$'\033[2m'
log()      { echo -e " ${c_dim}·${c_reset} $*"; }
log_pass() { echo -e " ${c_grn}✓${c_reset} $*"; }
log_fail() { echo -e " ${c_red}✗${c_reset} $*"; }
log_skip() { echo -e " ${c_ylw}∅${c_reset} $*"; }

# fail <msg>: report and return non-zero from the current scenario.
fail() { log_fail "$*"; return 1; }

# --- walle CLI ---------------------------------------------------------------

cli() { bash "$CLI" "$@"; }

# Treat a sandbox as a standalone yarn project (empty lockfile) and install.
sandbox_install() {
  local dir="$1"
  : >"${dir}/yarn.lock"
  ( cd "$dir" && yarn install --no-immutable ) >"${dir}/.e2e-install.log" 2>&1 \
    || { cat "${dir}/.e2e-install.log" >&2; return 1; }
}

sandbox_build() {
  local dir="$1"
  ( cd "$dir" && yarn build ) >"${dir}/.e2e-build.log" 2>&1
}

# Copy the minimal walle source subset the CLI needs.
make_source_subset() {
  local dest="$1"
  rm -rf "$dest"
  mkdir -p "$dest/walle" "$dest/src"

  for mod in ai backend ci cli harness-coding infrastructure website; do
    [ -d "${REPO_ROOT}/walle/$mod" ] && cp -a "${REPO_ROOT}/walle/$mod" "$dest/walle/$mod"
  done

  [ -d "${REPO_ROOT}/src/@walle" ] && cp -a "${REPO_ROOT}/src/@walle" "$dest/src/@walle"
  [ -f "${REPO_ROOT}/LICENSE" ] && cp -a "${REPO_ROOT}/LICENSE" "$dest/LICENSE"
  [ -d "${REPO_ROOT}/docs" ] && cp -a "${REPO_ROOT}/docs" "$dest/docs"
}

# --- assertions --------------------------------------------------------------

assert_exit0() { "$@" >/dev/null 2>&1 || fail "command failed: $*"; }
assert_path_absent() { [ ! -e "$1" ] || fail "path should not exist: $1"; }
assert_path_present() { [ -e "$1" ] || fail "path should exist: $1"; }
assert_file_contains() { grep -qF "$2" "$1" || fail "expected '$2' in $1"; }

# Validate a consumer manifest against the published schema.
assert_manifest_valid() {
  local manifest="$1"

  # ajv/ajv-formats are declared devDependencies of walle/website, so a repo with
  # the site deps installed already has them — no network needed. Only fall back
  # to a repo-root install if neither location resolves (e.g. a bare checkout).
  if [ ! -d "${REPO_ROOT}/node_modules/ajv" ] &&
    [ ! -d "${REPO_ROOT}/walle/website/node_modules/ajv" ]; then
    log "Installing local ajv for schema validation..."
    ( cd "$REPO_ROOT" && npm install --no-save ajv ajv-formats --silent ) >/dev/null 2>&1 || true
  fi

  export WALLE_MANIFEST="$manifest"
  export WALLE_REPO_ROOT="$REPO_ROOT"

  node -e '
    const path = require("path");
    const manifestPath = process.env.WALLE_MANIFEST;
    const repoRoot = process.env.WALLE_REPO_ROOT;

    // Try the repo root first, then walle/website (where they are declared).
    const roots = [repoRoot, path.join(repoRoot, "walle/website")];
    const load = (name) => {
      for (const r of roots) {
        try {
          return require(path.join(r, "node_modules", name));
        } catch {
          /* try next */
        }
      }
      throw new Error(name + " not found");
    };

    let Ajv, af;
    try {
      Ajv = load("ajv");
      af = load("ajv-formats");
    } catch (err) {
      console.error(" [ERROR] Failed to require local ajv. Manifest validation skipped/failed.");
      process.exit(1);
    }

    Ajv = Ajv.default || Ajv;
    af = af.default || af;

    const ajv = new Ajv({ strict: false });
    af(ajv);

    const schemaPath = path.join(repoRoot, "walle/website/schemas/walle.config.schema.json");
    const v = ajv.compile(require(schemaPath));

    if (!v(require(manifestPath))) {
      console.error(JSON.stringify(v.errors, null, 2));
      process.exit(1);
    }
  ' || fail "manifest invalid: $manifest"
}

tree_checksum() {
  local dir="$1"
  ( cd "$dir" && find . -type f \
      -not -path './node_modules/*' -not -path './.git/*' \
      -not -path './dist/*' -not -path './.astro/*' \
      -not -path './.yarn/*' -not -name 'yarn.lock' \
      -not -name '.e2e-*.log' \
      | LC_ALL=C sort | while read -r f; do
        if [ "$f" = './.walle/manifest.json' ] || [ "$f" = './.walle/lock' ]; then
          printf '%s  %s\n' "$(grep -v '"updatedAt"' "$f" | sha256sum | cut -d' ' -f1)" "$f"
        else
          printf '%s  %s\n' "$(sha256sum "$f" | cut -d' ' -f1)" "$f"
        fi
      done )
}

# --- http --------------------------------------------------------------------

http_expect_200() {
  local url="$1" workdir="$2"; shift 2
  local logf="${workdir}/.e2e-server.log"
  export HTTP_LAST_BODY=""
  ( cd "$workdir" && exec "$@" ) >"$logf" 2>&1 &
  local pid=$!
  local code="000" i died=0
  for i in $(seq 1 60); do
    if ! kill -0 "$pid" 2>/dev/null; then died=1; break; fi
    code="$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
    [ "$code" = "200" ] && break
    sleep 0.5
  done
  [ "$code" = "200" ] && HTTP_LAST_BODY="$(curl -s "$url" 2>/dev/null || true)"
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  [ "$code" = "200" ] && return 0
  if [ "$died" = "1" ]; then
    fail "server for ${url} exited before responding 200"
  else
    fail "timed out waiting for 200 at ${url} (got ${code} after 30s)"
  fi
  echo "--- ${logf} (tail) ---" >&2
  tail -n 20 "$logf" >&2 2>/dev/null || true
  return 1
}

assert_body_contains() {
  printf '%s' "$HTTP_LAST_BODY" | grep -qF -- "$1" || fail "expected '$1' in response body"
}

astro_bin() { echo "$1/node_modules/.bin/astro"; }
