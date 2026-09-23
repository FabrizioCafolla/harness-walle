# My Walle Site

An Astro site built with [Walle](https://github.com/FabrizioCafolla/harness-walle).

## Commands

```bash
just dev            # install deps + start the dev server
just build           # production build
just walle-check     # validate this project against the walle manifest
just walle-update    # update walle to the latest release
```

Run `just help` for the full list.

## Learn more

`src/@walle/` and a few other paths are walle-managed (read-only, resynced on `walle-update`).
Everything else here is yours to edit. See the
[walle wiki](https://github.com/FabrizioCafolla/harness-walle/blob/main/wiki/managed-vs-seed.md)
for what's managed, what's seeded, and how to customize the design system.
