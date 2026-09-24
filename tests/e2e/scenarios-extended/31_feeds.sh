#!/usr/bin/env bash
# Scenario: D18. seo.feeds — on by default for a fresh init (seeded from the demo's own
# app.json, same seed-once mechanism as OG), a real RSS file with absolute item links, the
# alternate link present and absolute in the built HTML head, excluded from the sitemap, and
# disabled means no route at all.

scenario_feeds() {
  local dir="${SANDBOX_DIR}/feeds"

  cli init --source "$REPO_ROOT" -n feeds -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1

  node -e "
    const app = require('$dir/src/configs/app.json');
    process.exit(app.seo && app.seo.feeds && app.seo.feeds.enabled === true ? 0 : 1);
  " || { fail "seo.feeds.enabled should default to true on a fresh init"; return 1; }

  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" \
    || { cat "${dir}/.e2e-build.log" >&2; fail "feeds build failed"; return 1; }

  assert_path_present "$dir/dist/rss.xml" || return 1
  grep -q '<rss version="2.0">' "$dir/dist/rss.xml" \
    || { fail "not a valid RSS 2.0 document"; return 1; }
  grep -qE "<link>https?://[^<]+</link>" "$dir/dist/rss.xml" \
    || { fail "feed item links are not absolute"; return 1; }

  grep -qE '<link rel="alternate" type="application/rss\+xml"[^>]*href="https?://[^"]+/rss\.xml"' \
    "$dir/dist/index.html" || { fail "alternate rss link missing or not absolute"; return 1; }

  if grep -q "rss.xml" "$dir"/dist/sitemap*.xml 2>/dev/null; then
    fail "rss.xml must not appear in the sitemap"
    return 1
  fi

  # Disabled: update never touches app.json (seed-once), so an existing consumer who drops the
  # whole seo block keeps feeds off after an update — no route, no error.
  node -e "
    const fs = require('fs');
    const p = '$dir/src/configs/app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    delete j.seo;
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  " || fail "could not clear seo from app.json" || return 1
  sandbox_build "$dir" \
    || { cat "${dir}/.e2e-build.log" >&2; fail "feeds-off build failed"; return 1; }
  assert_path_absent "$dir/dist/rss.xml" || return 1
}
