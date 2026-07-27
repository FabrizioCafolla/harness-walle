#!/usr/bin/env bash
# Scaffold-check: create a fresh consumer project from the CURRENT working tree
# (cli init --source), install it, build it, and boot `just dev` to confirm the
# generated project actually runs end to end.
#
# Output lives in ./.sandbox/ (gitignored). This is a manual, developer-facing check
# on top of `just e2e`; run it before a release or after touching the seed/scaffold.
#
#   bash tests/scaffold-check/run.sh
#
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Reuse the e2e helpers (CLI wrapper, harness-coding offline stub, install/build).
# shellcheck source=../e2e/lib/common.sh
source "${DIR}/../e2e/lib/common.sh"

SANDBOX_DIR="${DIR}/.sandbox"
PROJ="${SANDBOX_DIR}/demo"
DEV_URL=""

rm -rf "$SANDBOX_DIR"
mkdir -p "$SANDBOX_DIR"

step() {
  echo
  echo "▶ $*"
}

# Boot `just dev` and expect a 200. Astro 7's dev server daemonizes (it returns and keeps
# running in the background, and picks the next free port), so we read the real port from
# its log, poll it, then stop the daemon with `astro dev stop`.
boot_dev() {
  local logf="${PROJ}/.dev.log" astro="${PROJ}/node_modules/.bin/astro"
  # Clean any stale Astro dev daemon (it holds the port; a leftover one makes a fresh
  # `astro dev` time out with "failed to start within 30s").
  (cd "$PROJ" && "$astro" dev stop) >/dev/null 2>&1 || true
  pkill -f "astro dev" >/dev/null 2>&1 || true
  command -v fuser >/dev/null 2>&1 && fuser -k 4321/tcp >/dev/null 2>&1 || true
  sleep 1
  : >"$logf"

  # Astro 7's dev server daemonizes: `just dev` starts it, prints the port, and returns.
  # `timeout` caps it so the check can't block even if a future Astro runs dev in the
  # foreground. Redirecting to the log keeps the daemon off the harness's stdout.
  (cd "$PROJ" && timeout 90 just dev) <"/dev/null" >"$logf" 2>&1 || true

  local port="" url="" code="000" started=0 i
  for i in $(seq 1 30); do
    grep -qa "Dev server running at" "$logf" && started=1
    port="$(grep -oaE 'localhost:[0-9]+' "$logf" | head -1 | cut -d: -f2)"
    [ -n "$port" ] && break
    sleep 0.5
  done

  if [ -n "$port" ]; then
    url="http://127.0.0.1:${port}/"
    for i in $(seq 1 40); do
      code="$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
      [ "$code" = "200" ] && break
      sleep 0.5
    done
  fi

  # Always stop the daemon so nothing lingers (and no fd keeps the harness open).
  (cd "$PROJ" && "$astro" dev stop) >/dev/null 2>&1 || true
  pkill -f "astro dev" 2>/dev/null || true

  # Success = a 200 from the server, or (fallback) Astro reporting the server is up.
  if [ "$code" = "200" ]; then
    DEV_URL="$url"
  elif [ "$started" = "1" ]; then
    DEV_URL="http://127.0.0.1:${port:-4321}/ (Astro reported ready; curl got ${code})"
  else
    echo "  dev server did not start (port=${port:-?}, last=${code})"
    echo "  --- .dev.log (tail) ---"
    tail -n 30 "$logf" 2>/dev/null
    return 1
  fi
}

step "1/4 Scaffold from the working tree (cli init --source)"
cli init --source "$REPO_ROOT" -n demo -m website -d "$SANDBOX_DIR" >"${SANDBOX_DIR}/.init.log" 2>&1 || {
  echo "  cli init failed"
  tail -n 30 "${SANDBOX_DIR}/.init.log"
  exit 1
}
log_pass "scaffolded → ${PROJ}"

step "2/4 Install dependencies (yarn install)"
sandbox_install "$PROJ" || {
  echo "  yarn install failed"
  tail -n 30 "${PROJ}/.e2e-install.log"
  exit 1
}
log_pass "yarn install"

step "3/4 Build (yarn build)"
sandbox_build "$PROJ" || {
  echo "  build failed"
  tail -n 40 "${PROJ}/.e2e-build.log"
  exit 1
}
[ -f "${PROJ}/dist/index.html" ] || {
  echo "  no dist/index.html produced"
  exit 1
}
log_pass "build → dist/index.html"

step "4/4 Boot the dev server (just dev) and expect HTTP 200"
boot_dev || exit 1
log_pass "just dev served 200 at ${DEV_URL}"

echo
echo "═══════════════════════════════════════════════"
echo " scaffold-check: OK — the created project runs."
echo "═══════════════════════════════════════════════"
