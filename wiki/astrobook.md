# Astrobook

Walle ships a visual component catalog powered by [Astrobook](https://github.com/ocavue/astrobook). It is **repo-internal dev tooling** — it is not synced to consumer projects and is never included in the site build.

---

## Starting the catalog

```bash
just astrobook
```

Opens the catalog at `http://localhost:4321/astrobook`. The `just dev` and `just build` targets are unaffected — Astrobook only mounts when the `WALLE_ASTROBOOK=1` env var is set, which the `astrobook` just target handles.

---

## Story files

Stories live under the top-level `astrobook/` directory (outside `src/@walle/`, so they are never seeded to consumers). Each story file follows the `*.stories.ts` naming convention:

```
astrobook/
  elements/
    Badge.stories.ts
    Button.stories.ts
  features/
    Navbar.stories.ts
    Navbar.minimal.stories.ts
    Footer.stories.ts
    Footer.minimal.stories.ts
    Section.stories.ts
    SectionFlow.stories.ts
    SectionHeaderStandard.stories.ts
    BasicCard.stories.ts
    Breadcrumbs.stories.ts
    BlogArticleNavigation.stories.ts
    BlogFilters.stories.ts
    BlogReadingProgress.stories.ts
    BlogTableOfContents.stories.ts
```

Each component variant gets its own story file (e.g. `Navbar.stories.ts` for `standard`, `Navbar.minimal.stories.ts` for `minimal`).

---

## Story format

Every story file **must** import `StoryWrapper` and declare it as a decorator. `StoryWrapper` injects `@walle/styles/global.css` so CSS variables and typography are defined — without it, components render unstyled.

```ts
import type { ComponentProps } from "astro/types";
import Button from "@walle/components/elements/Button.astro";
import StoryWrapper from "../StoryWrapper.astro";

type ButtonProps = ComponentProps<typeof Button>;

export default {
  component: Button,
  decorators: [{ component: StoryWrapper }],
};

export const Primary = { args: { text: "Primary", type: "primary" } satisfies ButtonProps };
export const Secondary = { args: { text: "Secondary", type: "secondary" } satisfies ButtonProps };
export const Outline = { args: { text: "Outline", outline: true } satisfies ButtonProps };
```

- `export default` — registers the component and sets the decorator.
- Each named export is one preview card. The key becomes the label.
- `args` are the component props. Use `satisfies ComponentProps<typeof X>` for type safety.

---

## Adding a story

Every new `@walle` component or variant **must** ship with a story. No exceptions.

1. Create `astrobook/<group>/<Component>.stories.ts`.
2. Import the concrete `.astro` file (not the resolver, unless you want to test variant routing).
3. Import `StoryWrapper` and add `decorators: [{ component: StoryWrapper }]` to the default export.
4. Export at least one named preview with realistic `args`.
5. Add a visual regression test in `tests/playwright/astrobook.visual.spec.ts`.
6. Run `just astrobook-update-snapshots` to generate the baseline screenshot.

For a new variant, create a separate file: `astrobook/features/Footer.newvariant.stories.ts` importing `Footer.newvariant.astro` directly.

No registration step is required — Astrobook picks up `*.stories.*` files automatically from the `astrobook/` directory.

---

## Visual regression tests

Stories are covered by Playwright visual regression tests in `tests/playwright/astrobook.visual.spec.ts`. Each test navigates to the story URL and compares the page screenshot against a stored baseline.

```bash
just astrobook-test               # run visual regression (requires: just playwright-setup)
just astrobook-update-snapshots   # regenerate baselines after intentional changes
```

Baselines live in `tests/playwright/snapshots/` and are committed to git. If a test fails because of an intentional visual change, update the baselines and commit them together with the code change.
