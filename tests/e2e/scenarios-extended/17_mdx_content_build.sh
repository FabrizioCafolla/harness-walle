#!/usr/bin/env bash
# Scenario: a consumer that renders .mdx content must build.
#
# Regression guard for the b8489c1 class of bug: @astrojs/mdx 6.x's compiled output
# statically imports the `satteri` markdown engine (@astrojs/mdx/dist/satteri/index.js
# → import "satteri"), provided transitively by @astrojs/markdown-satteri. npm marks
# that peer as *optional*, and the other scenarios scaffold only .astro pages — so the
# satteri code path is never exercised and a missing dependency builds green there.
# A consumer with real .mdx content, however, fails with:
#   "Rollup failed to resolve import 'satteri'".
# Dropping @astrojs/markdown-satteri from the template must turn this scenario red.

scenario_mdx_content_build() {
  local dir="${SANDBOX_DIR}/mdx"

  cli init --source "$REPO_ROOT" -n mdx -m website -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed"

  # Force the mdx → satteri build path with a minimal .mdx page.
  cat >"$dir/src/pages/mdx-probe.mdx" <<'EOF'
---
title: MDX probe
---

# Hello from MDX

This page forces the `@astrojs/mdx` build path, which imports the `satteri`
markdown engine. If `@astrojs/markdown-satteri` is missing, the build fails to
resolve `satteri` and this scenario goes red.
EOF

  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" \
    || fail "mdx build failed — satteri engine unresolved? see ${dir}/.e2e-build.log" || return 1

  # The .mdx page must actually be emitted (proves the path ran, not silently skipped).
  ls "$dir"/dist/mdx-probe* >/dev/null 2>&1 || fail "mdx page not emitted to dist" || return 1
}
