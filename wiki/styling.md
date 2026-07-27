# Styling your site

Walle components never hardcode neutral colors — they reference a small set of **semantic
tokens** defined in `src/@walle/styles/global.css`. Overriding those tokens in your own
consumer CSS restyles every component at once, without touching `src/@walle/` (which
`walle update` would overwrite anyway).

There is deliberately **no built-in dark mode**: each site owns its look by extending the
global style through the interfaces below.

---

## The three styling layers

| Layer | Where | What it controls |
| --- | --- | --- |
| **Theme config** | `src/configs/theme.json` | Brand palette, fonts, spacing, radii → `--walle-*` CSS vars |
| **Semantic tokens** | your consumer `global.css` | Neutral surfaces, text, borders, focus — the component-facing interface |
| **Component CSS** | your consumer CSS / slots | Per-component fine-tuning |

Start from the top: most restyles need only `theme.json`. Reach for semantic tokens when the
neutral scale (backgrounds, muted text, borders) should change. Component-level CSS is the
last resort.

---

## Semantic tokens

Components reference **only** these for neutral colors:

```css
:root {
  --surface: var(--white);          /* page and card backgrounds */
  --surface-alt: var(--gray-light); /* alternate sections, code, image placeholders */
  --text: var(--black);             /* headings, strong text */
  --text-muted: var(--gray-dark);   /* body copy, captions, meta */
  --border: var(--gray-medium);     /* card and control borders */
  --link: var(--primary);
  --link-hover: var(--primary-dark);
  --focus-ring: var(--primary);     /* :focus-visible outline everywhere */
  --disabled-opacity: 0.65;
}
```

Override them in your consumer `src/styles/global.css` (loaded after the walle defaults):

```css
:root {
  --surface: #faf8f5;
  --surface-alt: #f0ece6;
  --border: #d8d2c8;
}
```

Brand colors (`--primary`, `--secondary`, …) stay in `theme.json` — the semantic layer maps
onto them, so a palette change propagates automatically.

---

## Accessibility contract

The default pairings pass WCAG 2.2 AA and are enforced by
`walle/website/tests/unit/contrast.test.ts` (16 real text/surface pairings). When you
override tokens, keep the same bar:

- `--text` and `--text-muted` need **≥ 4.5:1** contrast on `--surface`, `--surface-alt`
  **and** `--gray` (the footer background).
- `--focus-ring` must stay clearly visible on `--surface`.
- Never counter the global `prefers-reduced-motion` kill-switch.

The axe CI gate (`just a11y-test`) will catch violations on the demo pages, but consumer
pages are your own responsibility — run axe (or Lighthouse) against your site after a
restyle.
