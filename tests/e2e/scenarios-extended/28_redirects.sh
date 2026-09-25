# Scenario: `astro.redirects` passes straight through to Astro's native redirects. Astro's
# own static-output redirect page already emits refresh/noindex/canonical: this only has to
# confirm the pass-through actually reaches Astro, and that walle additionally excludes the
# redirect source from sitemap.xml (Astro's sitemap integration doesn't know about redirects).

scenario_redirects() {
  local dir="${SANDBOX_DIR}/redirects"

  cli init --source "$REPO_ROOT" -n redirects -m website -d "$SANDBOX_DIR" >/dev/null || fail "cli init failed" || return 1

  node -e "const fs=require('fs');const p='$dir/src/configs/app.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.astro.redirects={'/old-page':'/'};fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');" \
    || fail "could not set astro.redirects in app.json" || return 1

  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" || fail "redirects build failed" || return 1

  local redirect_page="$dir/dist/old-page/index.html"
  assert_path_present "$redirect_page" || return 1
  assert_file_contains "$redirect_page" 'http-equiv="refresh"' || return 1
  assert_file_contains "$redirect_page" '<meta name="robots" content="noindex">' || return 1
  assert_file_contains "$redirect_page" 'rel="canonical"' || return 1

  # The redirect source never appears in the sitemap, but real pages still do.
  local sitemap="$dir/dist/sitemap-0.xml"
  assert_path_present "$sitemap" || return 1
  if grep -q "old-page" "$sitemap"; then
    fail "redirect source should be excluded from sitemap.xml"
    return 1
  fi
  assert_file_contains "$sitemap" "<loc>" || return 1
}
