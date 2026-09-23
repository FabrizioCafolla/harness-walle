#!/usr/bin/env bash
# Scenario: seo.ogImage (D13) — on by default for a fresh init (seeded from the demo's own
# app.json), off by default for an existing/updated consumer that never opted in, and a
# per-collection template override actually changes the rendered image.

scenario_og_images() {
  local dir="${SANDBOX_DIR}/og-images"

  cli init --source "$REPO_ROOT" -n og-images -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1

  # Fresh init: enabled true out of the box, no config from the consumer.
  node -e "
    const app = require('$dir/src/configs/app.json');
    process.exit(app.seo && app.seo.ogImage && app.seo.ogImage.enabled === true ? 0 : 1);
  " || { fail "seo.ogImage.enabled should default to true on a fresh init"; return 1; }

  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" \
    || { cat "${dir}/.e2e-build.log" >&2; fail "og-images build failed"; return 1; }

  assert_path_present "$dir/dist/og/default.png" || return 1
  assert_path_present "$dir/dist/og/posts/example.png" || return 1

  # "Off on update": update never touches app.json at all (seed-once), so an existing consumer
  # who removes the whole seo block keeps OG off after an update — no route, no error.
  node -e "
    const fs = require('fs');
    const p = '$dir/src/configs/app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    delete j.seo;
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  " || fail "could not clear seo from app.json" || return 1
  sandbox_build "$dir" \
    || { cat "${dir}/.e2e-build.log" >&2; fail "og-off build failed"; return 1; }
  assert_path_absent "$dir/dist/og" || return 1

  # Re-enable, plus a custom per-collection template: it must actually change the rendered
  # output for that collection, not silently fall back to walle's own default.
  mkdir -p "$dir/src/og"
  cat >"$dir/src/og/custom.ts" <<'TEMPLATE'
export default function customTemplate(entry) {
  return {
    type: "div",
    props: {
      style: { width: "100%", height: "100%", display: "flex", backgroundColor: "#ff00ff" },
      children: {
        type: "div",
        props: { style: { fontSize: 40, color: "#ffffff" }, children: entry.title },
      },
    },
  };
}
TEMPLATE
  node -e "
    const fs = require('fs');
    const p = '$dir/src/configs/app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.seo = { ogImage: { enabled: true, collections: ['posts'], templates: { posts: './src/og/custom.ts' } } };
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  " || fail "could not set seo.ogImage.templates" || return 1
  sandbox_build "$dir" \
    || { cat "${dir}/.e2e-build.log" >&2; fail "custom-template build failed"; return 1; }

  assert_path_present "$dir/dist/og/default.png" || return 1
  assert_path_present "$dir/dist/og/posts/example.png" || return 1

  local default_size posts_size
  default_size=$(wc -c <"$dir/dist/og/default.png")
  posts_size=$(wc -c <"$dir/dist/og/posts/example.png")
  if [ "$default_size" = "$posts_size" ]; then
    fail "custom per-collection template produced the same output as walle's own default"
    return 1
  fi
}
