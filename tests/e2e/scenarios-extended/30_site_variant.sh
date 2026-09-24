#!/usr/bin/env bash
# Scenario: a consumer defines "site" once, at `@layer site` (D4), and every component that
# reads variant tokens (Button, Badge, a Section) picks it up with no per-component styling.

scenario_site_variant() {
  local dir="${SANDBOX_DIR}/sitevariant"

  cli init --source "$REPO_ROOT" -n sitevariant -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1
  sandbox_install "$dir" || fail "yarn install failed" || return 1

  # The consumer's own @layer site override, seeded empty by walle (D4): this is the ONLY
  # styling a site adds to brand the "site" variant everywhere it is used.
  cat >>"$dir/src/styles/global.css" <<'EOF'
@layer site {
  [data-variant="site"] {
    --variant-bg: #123456;
  }
}
EOF

  mkdir -p "$dir/src/pages"
  cat >"$dir/src/pages/site-variant-test.astro" <<'EOF'
---
import { BaseLayout } from "@walle/layouts";
import { Badge, Button, Section } from "@walle/components";
---

<BaseLayout headerTitle="Site variant test" headerDescription="Site variant test page.">
  <Button text="Site button" variant="site" />
  <Badge text="Site badge" variant="site" />
  <Section title="Site section" variant="site" filled={true}>
    <p>Site-variant section content.</p>
  </Section>
</BaseLayout>
EOF

  sandbox_build "$dir" || fail "build with a site-variant page failed" || return 1

  local page="$dir/dist/site-variant-test/index.html"
  assert_path_present "$page" || return 1

  # Button, Badge and the Section's wrapper each emit data-variant="site" on their own root
  # (attrs.ts's variantAttrs): three separate components, not just one shared ancestor.
  local hits
  hits="$(grep -o 'data-variant="site"' "$page" | wc -l)"
  [ "$hits" -ge 3 ] || { fail "expected data-variant=\"site\" on Button, Badge and the Section wrapper, found ${hits}"; return 1; }

  # The site's own @layer site override actually reached the compiled CSS, not just the source:
  # walle's own tokens.css never uses this literal, so its presence proves the override applied.
  grep -rq "123456" "$dir/dist" || { fail "the site's @layer site override did not reach the built CSS"; return 1; }
}
