#!/usr/bin/env bash
# Scenario: commerce.mode "off" (D10) — no cart script/styles, no /products route, and no
# Shopify Storefront request, in a fresh consumer sandbox. As of 16.2 a fresh init's app.json
# carries no `commerce` key at all (stripped from the demo's own on seed), which already
# behaves as "off" everywhere `commerce?.mode` is read — no need to force it here.

scenario_commerce_off() {
  local dir="${SANDBOX_DIR}/commerce-off"

  cli init --source "$REPO_ROOT" -n commerce-off -m website -d "$SANDBOX_DIR" >/dev/null \
    || fail "cli init failed" || return 1
  sandbox_install "$dir" || fail "yarn install failed" || return 1
  sandbox_build "$dir" || { cat "${dir}/.e2e-build.log" >&2; fail "commerce-off build failed"; return 1; }

  # No products route at all (D10 — injected only for catalog/shop). Also 16.2: the demo's own
  # `astro.redirects` to demo product handles are stripped from the seed, so a fresh consumer
  # has no /products path whatsoever, not even the old redirect stubs.
  assert_path_absent "$dir/dist/products" || return 1

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
