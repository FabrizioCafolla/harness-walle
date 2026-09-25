#!/usr/bin/env bash
# Scenario: app.json "components" selects a walle built-in name, a site path, or fails
# the build.

# Sets app.json's "components" field to the given JSON object, in the given sandbox.
set_components_json() {
  local dir="$1" json="$2"
  node -e "
    const fs = require('fs');
    const p = '$dir/src/configs/app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.components = $json;
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  " || fail "could not set components in app.json"
}

scenario_component_overrides() {
  local dir="${SANDBOX_DIR}/overrides"

  cli init --source "$REPO_ROOT" -n overrides -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1
  sandbox_install "$dir" || fail "yarn install failed" || return 1

  # Built-in name: minimal navbar/footer build and render.
  set_components_json "$dir" '{"navbar":"minimal","footer":"minimal"}' || return 1
  sandbox_build "$dir" || fail "minimal layout build failed" || return 1
  grep -rl "navbar-minimal" "$dir/dist" >/dev/null 2>&1 || { fail "minimal navbar not rendered"; return 1; }

  # Site path: a plain override renders in place of the walle card in the blog list.
  mkdir -p "$dir/src/components"
  cat >"$dir/src/components/EventCard.astro" <<'EOF'
---
export interface Props {
  title: string;
  href: string;
}
const { title, href } = Astro.props;
---
<a href={href} class="event-card-override" data-testid="event-card-override">{title}</a>
EOF
  set_components_json "$dir" '{"card":"./src/components/EventCard.astro"}' || return 1
  sandbox_build "$dir" || fail "site path card build failed" || return 1
  assert_file_contains "$dir/dist/blog/index.html" "event-card-override" \
    || { fail "site override card not rendered in blog list"; return 1; }

  # Site path wrapping the original: imports the walle card by file path (not through
  # @walle/components or virtual:walle-components, which would cycle back to this same
  # override) and renders both, without recursion.
  cat >"$dir/src/components/WrappingCard.astro" <<'EOF'
---
import BasicCard from "../@walle/components/features/Card/BasicCard.astro";
const props = Astro.props;
---
<div class="wrapping-card-override" data-testid="wrapping-card-override">
  <BasicCard {...props} />
</div>
EOF
  set_components_json "$dir" '{"card":"./src/components/WrappingCard.astro"}' || return 1
  sandbox_build "$dir" || fail "wrapping override build failed" || return 1
  assert_file_contains "$dir/dist/blog/index.html" "wrapping-card-override" \
    || { fail "wrapping override itself did not render"; return 1; }
  assert_file_contains "$dir/dist/blog/index.html" "card__title" \
    || { fail "the walle card wrapped inside the override did not render"; return 1; }

  # Missing path: build fails, message names the key and the path.
  set_components_json "$dir" '{"card":"./src/components/Nope.astro"}' || return 1
  if sandbox_build "$dir" >/dev/null 2>&1; then
    fail "build should fail on a missing site path"
    return 1
  fi
  grep -q "components.card" "$dir/.e2e-build.log" || { fail "missing-path error does not name components.card"; return 1; }
  grep -q "Nope.astro" "$dir/.e2e-build.log" || { fail "missing-path error does not name the path"; return 1; }

  # Unknown name: build fails, message names the key.
  set_components_json "$dir" '{"navbar":"does-not-exist"}' || return 1
  if sandbox_build "$dir" >/dev/null 2>&1; then
    fail "build should fail on an unregistered name"
    return 1
  fi
  grep -q "components.navbar" "$dir/.e2e-build.log" || { fail "unknown-name error does not name components.navbar"; return 1; }
}
