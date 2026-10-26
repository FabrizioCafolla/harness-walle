#!/usr/bin/env bash
# Scenario: a two-language consumer (it default, en) builds with `i18n` declared in app.json:
# html lang and hreflang per page, the switcher offering only the languages a page exists in,
# and a sitemap with alternates only for pages that have a translation.

scenario_i18n() {
  local dir="${SANDBOX_DIR}/i18n"

  cli init --source "$REPO_ROOT" -n i18n -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1
  sandbox_install "$dir" || fail "yarn install failed" || return 1

  rm -rf "$dir/src/pages/blog" "$dir/src/pages/index.astro" "$dir/src/pages/privacy-policy.astro" \
    "$dir/src/pages/terms-and-conditions.astro"
  mkdir -p "$dir/src/pages/[lang]"
  cat >"$dir/src/pages/[lang]/[...slug].astro" <<'PAGE'
---
import { BaseLayout } from "@walle/layouts";
import { LanguageSwitcher } from "@walle/components";

export function getStaticPaths() {
  return [
    { params: { lang: "it", slug: "a" } },
    { params: { lang: "en", slug: "a" } },
    { params: { lang: "it", slug: "solo" } },
  ];
}
const { slug } = Astro.params;
const translations = slug === "solo" ? ["it"] : ["it", "en"];
---

<BaseLayout headerTitle={slug} headerTranslations={translations}>
  <LanguageSwitcher translations={translations} />
</BaseLayout>
PAGE

  node -e "
    const fs = require('fs');
    const p = '$dir/src/configs/app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.astro.trailingSlash = 'always';
    j.seo = { ogImage: { enabled: false }, feeds: { enabled: false } };
    j.i18n = {
      defaultLocale: 'it',
      locales: {
        it: { lang: 'it-IT', label: 'Italiano' },
        en: { lang: 'en-US', label: 'English', labels: { skipLink: 'Skip to the content' } },
      },
    };
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  " || fail "could not patch app.json" || return 1

  sandbox_build "$dir" || { cat "${dir}/.e2e-build.log" >&2; fail "i18n build failed"; return 1; }

  local it="$dir/dist/it/a/index.html" en="$dir/dist/en/a/index.html" solo="$dir/dist/it/solo/index.html"
  grep -q '<html lang="it-IT"' "$it" || fail "it page has no html lang it-IT" || return 1
  grep -q '<html lang="en-US"' "$en" || fail "en page has no html lang en-US" || return 1
  grep -q 'hreflang="en-US" href="http://localhost:4321/en/a/"' "$it" \
    || fail "it page has no hreflang to the en page" || return 1
  grep -q 'hreflang="x-default" href="http://localhost:4321/it/a/"' "$en" \
    || fail "en page has no x-default to the it page" || return 1
  grep -q 'Skip to the content' "$en" || fail "en page does not use the en labels" || return 1
  grep -q 'Skip to content' "$it" || fail "it page lost the base labels" || return 1

  # The switcher offers the other language where it exists, and nothing where it does not.
  grep -q 'class="language-switcher"' "$it" || fail "it page has no language switcher" || return 1
  if grep -q 'class="language-switcher"' "$solo"; then
    fail "the switcher shows on a page that exists in one language"
    return 1
  fi
  if grep -q 'hreflang' "$solo"; then
    fail "hreflang present on a page that exists in one language"
    return 1
  fi

  # Sitemap alternates exist only for the translated page.
  local map="$dir/dist/sitemap-0.xml"
  grep -q '<loc>http://localhost:4321/it/a/</loc><xhtml:link' "$map" \
    || fail "sitemap: it/a has no alternates" || return 1
  if grep -q '<loc>http://localhost:4321/it/solo/</loc><xhtml:link' "$map"; then
    fail "sitemap: alternates declared for a page with no translation"
    return 1
  fi
}
