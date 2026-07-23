import { defineConfig } from "@playwright/test";

// Separate Playwright config for Astrobook visual regression.
// Run with: just astrobook-test (or: yarn playwright test --config playwright.astrobook.config.ts)
// First run creates the baseline screenshots; subsequent runs compare against them.
// Update baselines: just astrobook-update-snapshots
//
// Prerequisite: run `just playwright-setup` once to install browser binaries.
// Playwright 1.52+ splits the download: run `playwright install chromium chromium-headless-shell`.
export default defineConfig({
  testDir: "./tests/playwright",
  // a11y.spec.ts shares this config (same astrobook webServer); run one suite by
  // passing its filename: yarn playwright test --config playwright.astrobook.config.ts a11y.spec.ts
  testMatch: ["**/*.visual.spec.ts", "**/a11y.spec.ts"],
  // Pin to bundled Playwright Chromium for consistent cross-platform snapshots.
  projects: [{ name: "chromium" }],
  use: {
    baseURL: "http://localhost:4321",
  },
  webServer: {
    // env -u CLAUDECODE …: astro 7 auto-daemonizes `astro dev` when it detects an
    // AI-agent environment, which makes Playwright's webServer see the process
    // "exit early" (or silently reuse a stale daemon with outdated story routes).
    // Unsetting the detection vars forces a normal foreground server. No-op on CI.
    // --force: replace a stale-locked astro dev server (interrupted runs leave a
    // lock that blocks the next spawn; reuseExistingServer already covers the
    // healthy-server case, so force only fires on the broken one).
    command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT yarn astrobook --force",
    // Base-prefixed: routes mount under astro's base (see storyRoutes.ts) — the
    // unprefixed /astrobook answers inconsistently depending on the Accept header.
    url: "http://localhost:4321/harness-walle/astrobook",
    reuseExistingServer: true,
    // 120s, not 60s: right after a fresh `yarn install` (no warm Vite dep-optimization cache),
    // cold astro dev boot has been observed to take 50s+; 60s left too little margin on CI.
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },
  snapshotPathTemplate: "{testDir}/snapshots/{arg}{ext}",
});
