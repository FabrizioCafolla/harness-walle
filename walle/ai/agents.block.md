## Walle design system (managed block)

This project uses the [Walle](https://github.com/FabrizioCafolla/harness-walle)
design system. The `@walle/` namespaces are **read-only**: they are overwritten on every
`just walle-update`. Customize through the consumer zones only.

- **Consumer zones (never overwritten):** `src/configs/`, `src/styles/global.css`,
  `src/components/`, `src/pages/`, `src/content/`, `astro.config.mjs`, `package.json`,
  `.vscode/`.
- **Config:** edit `src/configs/*.json` (validated by `just validate-configs`). `app.json`
  drives metadata, the optional `astro.ssr` flag, and component variants; `theme.json` holds
  design tokens.
- **Astro config:** `astro.config.mjs` is a thin `defineWalleConfig({})` shell — pass native
  Astro overrides there (scalars override, `integrations` merge additively).
- **Updates:** run `just walle-update`. Only the declared modules' `@walle/` paths are synced;
  this managed block is rewritten in place between its markers.

Do not edit files inside `@walle/` directories, and do not edit the content between the
`[walle:START]` / `[walle:END]` markers by hand — both are regenerated on update.
