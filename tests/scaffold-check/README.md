# Scaffold-check

A manual, developer-facing smoke test that proves a **fresh consumer project created from
the current working tree actually runs** — end to end, up to `just dev`.

```bash
bash tests/scaffold-check/run.sh
```

It performs the four steps a real user would, against the local source (`cli init --source`):

1. **Scaffold** a project from the working tree into `./.sandbox/demo` (gitignored).
2. **Install** dependencies (`yarn install`).
3. **Build** the site (`yarn build`) and assert `dist/index.html` exists.
4. **Boot** the dev server (`just dev`) and assert it answers HTTP 200.

Astro 7's dev server runs in the background and picks the next free port, so step 4 reads
the real port from the dev log, polls it, then stops the daemon (`astro dev stop`).

## When to run it

Before a release, or after touching anything in the scaffold path: the seed
`package.json`/configs, `cli.sh`, the injected justfile recipes, or a new managed dependency
(a missing dep here is the classic "builds in the repo, breaks for consumers" bug).

It complements `just e2e` (which runs the full scenario matrix). This one is a single, quick,
human-readable "does the created project boot?" check. The `.sandbox/` output is gitignored.
