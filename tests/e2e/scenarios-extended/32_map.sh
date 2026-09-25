#!/usr/bin/env bash
# Scenario: A real consumer build with a Map page: invalid coordinates are still
# filtered server-side outside this repo, and leaflet lands in its own lazy chunk rather than
# the eager page bundle.

scenario_map() {
  local dir="${SANDBOX_DIR}/map"

  cli init --source "$REPO_ROOT" -n map -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1

  mkdir -p "$dir/src/pages"
  cat >"$dir/src/pages/map-demo.astro" <<'PAGE'
---
import { BaseLayout } from "@walle/layouts";
import { Map } from "@walle/components";
---

<BaseLayout headerTitle="Map demo">
  <Map
    markers={[
      { lat: 41.9028, lng: 12.4964, title: "Valid marker" },
      { lat: 200, lng: 12.4964, title: "Invalid marker" },
    ]}
  />
</BaseLayout>
PAGE

  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" \
    || { cat "${dir}/.e2e-build.log" >&2; fail "map build failed"; return 1; }

  assert_path_present "$dir/dist/map-demo/index.html" || return 1

  grep -q "Valid marker" "$dir/dist/map-demo/index.html" \
    || fail "valid marker missing from the built page" || return 1
  grep -q "Invalid marker" "$dir/dist/map-demo/index.html" \
    && { fail "invalid coordinates were not filtered out of the built page"; return 1; }

  # Leaflet is lazy: it must exist as its own chunk, never inlined into the page's own script.
  if ! find "$dir/dist/_astro" -iname "leaflet*.js" | grep -q .; then
    fail "no separate leaflet chunk found in dist/_astro"
    return 1
  fi
}
