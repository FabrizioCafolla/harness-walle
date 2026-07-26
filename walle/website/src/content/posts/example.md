---
title: Designing an Accessible Component Library with Astro
description: How to structure reusable, WCAG 2.2 AA components in Astro with semantic tokens, slots, and stories that stay maintainable as the system grows.
author: Fabrizio Cafolla
publishDate: 2026-01-12
tags: ["Astro", "Accessibility", "Design Systems", "Performance"]
image: /img/blog-demo-1.jpg
---

## Why a component library, not a theme

A theme decorates markup you have already written. A component library gives you
the markup itself: buttons, cards, sections, navigation, with accessibility,
responsiveness, and metadata already handled. The difference shows up six months
later, when a redesign is a token change instead of a rewrite.

This post walks through the principles behind the Walle library, a small set of
rules that keep components consistent without freezing them.

### Semantic tokens over hardcoded colors

Every color, space, and radius is a CSS variable with a semantic name, such as
`--surface`, `--text-muted`, or `--border`, mapped onto a palette. Components never
reference a hex value directly. Rebranding is editing one layer, and the components
inherit it everywhere.

- One source of truth for the visual language
- Contrast pairings verified once, in a unit test
- Consumers restyle by overriding tokens, not forking components

### Accessibility is a default, not a checklist

Skip links, focus-visible rings, reduced-motion handling, and 320px reflow are
built into the layouts and enforced by an automated axe gate. A component that
fails the gate does not ship.

> Accessibility that lives in a review checklist gets skipped under deadline.
> Accessibility that lives in the test suite does not.

### Stories keep the surface honest

Every component ships with a catalog story. If a prop exists, there is a story
that renders it, so the documented API and the real API never drift apart.

```astro
---
import { Button } from "@walle/components";
---

<Button text="Primary" variant="primary" />
<Button text="With icon" icon="fa:github" variant="secondary" />
```

### Image

![Component library preview](./blog-demo-1.jpg)

### Where the boundaries sit

| Concern          | Lives in          | Updated by        |
| ---------------- | ----------------- | ----------------- |
| Visual language  | Semantic tokens   | Consumer override |
| Component markup | Managed `@walle/` | Library release   |
| Page content     | Consumer zones    | You               |

## Takeaways

Keep the rules few and enforce them automatically. Tokens for the look,
accessibility in the test suite, a story per component. That is most of what
keeps a design system usable long after the first launch.

Have a pattern you keep re-implementing across projects? That is usually the next
component worth generalizing.
