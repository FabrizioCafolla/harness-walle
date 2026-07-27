---
title: A Pragmatic CI/CD Pipeline with GitHub Actions
description: A lean GitHub Actions setup that lints, builds, tests accessibility, and deploys to GitHub Pages without turning your workflow into a maze.
author: Fabrizio Cafolla
publishDate: 2026-01-20
tags: ["CI/CD", "GitHub Actions", "DevOps", "Performance"]
image: /img/blog-demo-2.jpg
---

## The goal: boring, fast, trustworthy

A good pipeline is invisible. It runs on every push, tells you within a couple of
minutes whether the change is safe, and deploys itself when the branch is green.
Anything more elaborate tends to become the thing you maintain instead of the
thing you ship.

Walle scaffolds exactly this: a single workflow with a few focused jobs and no
bespoke glue.

### One workflow, a few honest jobs

Each job answers one question. If it fails, you know immediately what broke.

1. **Lint**: formatting and static analysis, the cheapest signal first
2. **Build**: the site compiles and every route renders
3. **Accessibility**: an axe gate over the pages and component stories
4. **Deploy**: publish to GitHub Pages when the default branch is green

### Cache what is slow, skip what is not

The lockfile lives in the site subdirectory, so the dependency cache points there
directly. Installs drop from a minute to seconds, and the pipeline stays honest
because nothing is mocked away.

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 24
    cache: yarn
    cache-dependency-path: walle/website/yarn.lock
```

> Optimize the pipeline for the failure case. You read green runs for two seconds.
> You read red runs line by line. Make the red ones legible.

### Keep the gate meaningful

A quality gate only helps if it can actually fail. The accessibility job runs the
same axe checks locally and in CI, so a violation is caught on the branch, not
discovered in production.

| Stage  | Runs on        | Fails the build on          |
| ------ | -------------- | --------------------------- |
| Lint   | every push     | style / static errors       |
| Build  | every push     | compile or route errors     |
| A11y   | every push     | serious / critical axe hits |
| Deploy | default branch | any earlier job red         |

## Takeaways

Fewer jobs, each with a clear purpose, cached where it counts, deploying itself on
green. That is the whole pipeline, and it is enough for most sites.

Once the basics are reliable, adding an end-to-end job or a preview deploy is a
small, safe increment rather than a rewrite.
