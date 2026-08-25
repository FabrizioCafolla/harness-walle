# Progressive web app

Walle ships an optional PWA layer: a **web app manifest**, a **Workbox service worker** generated
at build time, and the registration script that installs it. It is **off by default**. A site that
never opts in has no manifest, no service worker, no registration script, and nothing extra in any
page: the integration is not even mounted.

`@vite-pwa/astro` is a walle dependency, so it is installed everywhere; with `pwa.enabled`
false the integration is never mounted, so it costs an entry in `node_modules` and nothing in
any page.

## Turning it on

One key in `src/configs/app.json`:

```json
{
  "pwa": {
    "enabled": true
  }
}
```

That alone produces a valid installable manifest, because every field falls back to something the
site already declares:

| Manifest field     | Falls back to              |
| ------------------ | -------------------------- |
| `name`             | `website.title`            |
| `short_name`       | `pwa.name`                 |
| `description`      | `website.description`      |
| `lang`             | `website.language`         |
| `theme_color`      | theme palette `primary`    |
| `background_color` | theme palette `background` |
| `start_url`        | `astro.basePath`           |
| `scope`            | `astro.basePath`           |
| `display`          | `"standalone"`             |

Write only what differs. Icons are the one thing walle cannot invent, so a real install prompt
needs them:

```json
{
  "pwa": {
    "enabled": true,
    "shortName": "Eventi",
    "icons": [
      { "src": "/pwa-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/pwa-512.png", "sizes": "512x512", "type": "image/png" },
      {
        "src": "/pwa-512-maskable.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
    "appleTouchIcon": "/apple-touch-icon.png"
  }
}
```

Icon files live in `public/`. `appleTouchIcon` is optional: omit it and no `apple-touch-icon` link
is emitted.

## What ends up in the page

When enabled, `Head.astro` emits exactly four things: the manifest link, `theme-color`, the
optional apple-touch-icon link, and `<script defer src="/registerSW.js">`.

That last one is deliberate. vite-plugin-pwa injects its own registration through a
`transformIndexHtml` pass that **Astro's static build never runs**: the file is generated into
`dist/` but no page ever references it, which is why walle emits the tag itself. The generated
script registers the worker inside its own `load` listener, so registration costs the page nothing
before first paint and `workbox-window` never enters the page bundle.

## Caching defaults

| Content                | Strategy                                               |
| ---------------------- | ------------------------------------------------------ |
| `_astro/**/*.{js,css}` | precached (content-hashed, immutable by construction)  |
| Navigations (HTML)     | `NetworkFirst`, 3s network timeout, cache `html-pages` |
| Everything else        | not cached by the worker                               |

HTML is deliberately not precached: a stale page must never win over a reachable network.
`navigateFallback` is explicitly `null`, overriding vite-plugin-pwa's own `"/"` default — that
default emits a navigation route bound to a URL that is not in the precache, which throws
`non-precached-url` at worker startup, _before_ any runtime rule registers, leaving a worker that
silently caches nothing (vite-pwa/vite-plugin-pwa#731, #400).

## Customizing beyond the manifest

Manifest content is site content, so it lives in `app.json`. The Astro-side knobs are code, so they
are overridden natively from `astro.config.mjs` and merged one level deep over walle's defaults:

```js
export default defineWalleConfig({
  pwa: {
    workbox: {
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname === "/feed.json",
          handler: "StaleWhileRevalidate",
          options: { cacheName: "events-feed" },
        },
      ],
    },
  },
});
```

Anything `@vite-pwa/astro` accepts is valid there (`registerType`, `workbox`, `devOptions`, …).
Passing `manifest` works too and wins over the `app.json`-derived values.

`runtimeCaching` is the one key that merges instead of replacing: consumer rules are placed
**before** walle's, and Workbox takes the first route that matches. So the example above keeps the
HTML rule it never mentions, and a consumer rule for navigations would win over walle's.

## Serving the worker

`sw.js` and `manifest.webmanifest` keep stable filenames while their content changes every build,
so they must **not** be served `immutable`. Give them `max-age=0, must-revalidate` at the origin,
and make sure the deploy actually rewrites that header: `aws s3 sync` (and most equivalents) skips
files whose bytes are unchanged, so a header-only fix never reaches a worker whose code did not
change.
