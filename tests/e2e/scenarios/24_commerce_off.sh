#!/usr/bin/env bash
# Scenario: commerce.mode "off" (D10) — no cart script/styles, no /products route, and no
# Shopify Storefront request, in a fresh consumer sandbox.

set_commerce_json() {
  local dir="$1" json="$2"
  node -e "
    const fs = require('fs');
    const p = '$dir/src/configs/app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.commerce = $json;
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  " || fail "could not set commerce in app.json"
}

scenario_commerce_off() {
  local dir="${SANDBOX_DIR}/commerce-off"

  cli init --source "$REPO_ROOT" -n commerce-off -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1
  sandbox_install "$dir" || fail "yarn install failed" || return 1

  set_commerce_json "$dir" '{"mode":"off"}' || return 1
  sandbox_build "$dir" || { cat "${dir}/.e2e-build.log" >&2; fail "commerce-off build failed"; return 1; }

  # No products route (D10 — injected only for catalog/shop). The seed's demo `astro.redirects`
  # still produce dist/products/example(-2)/ regardless of commerce mode (an unrelated,
  # pre-existing redirect pair, not the injected list/detail route) — check the injected
  # index page itself is absent, not the whole directory.
  assert_path_absent "$dir/dist/products/index.html" || return 1

  # No cart script or markup: CartMount/CartBadge come from virtual:walle-features, which
  # resolves to null at the module-graph level when off, so neither component's file — and
  # therefore none of its own classes/attributes — reaches dist at all (unlike Navbar's own
  # `.cart-badge--inline` rule, which styles the slot from outside and stays in every build).
  if grep -rl "cart-drawer" "$dir/dist" >/dev/null 2>&1; then
    fail "cart-drawer (CartMount) markup/styles found in dist when commerce is off"
    return 1
  fi
  if grep -rl "data-cart-badge" "$dir/dist" >/dev/null 2>&1; then
    fail "data-cart-badge (CartBadge) markup found in dist when commerce is off"
    return 1
  fi

  # No Storefront request: the products collection loader (shopify.ts) never even runs when
  # commerce is off, so its own "loading N fixture products" / "Loaded N Shopify products" log
  # line — its only observable side effect — must be entirely absent from the build log.
  if grep -qi "shopify" "${dir}/.e2e-build.log"; then
    fail "shopify products loader ran even though commerce is off"
    return 1
  fi
}
