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
    command: "yarn astrobook",
    url: "http://localhost:4321/astrobook",
    reuseExistingServer: true,
    // 120s, not 60s: right after a fresh `yarn install` (no warm Vite dep-optimization cache),
    // cold astro dev boot has been observed to take 50s+; 60s left too little margin on CI.
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },
  snapshotPathTemplate: "{testDir}/snapshots/{arg}{ext}",
});
