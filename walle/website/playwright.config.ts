import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playwright",
  // Astrobook visual regression has its own config/webServer (playwright.astrobook.config.ts)
  // — without this, the default testDir glob also picks up *.visual.spec.ts, which needs a
  // different integration (astrobook subpath) mounted only under `yarn astrobook`.
  testIgnore: "**/*.visual.spec.ts",
  use: {
    baseURL: "http://localhost:4321/harness-walle",
  },
  webServer: {
    // env -u CLAUDECODE …: see playwright.astrobook.config.ts — prevents astro 7's
    // AI-agent auto-daemonization from breaking Playwright's webServer lifecycle.
    command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT yarn dev --force",
    // Must match use.baseURL: astro.config's base ("/harness-walle", from
    // src/configs/app.json's astro.basePath) means the bare root 404s — a readiness check
    // against it never gets a 2xx, so Playwright polls until timeout even though the server
    // is genuinely up (confirmed via CI: "astro ready in 1965ms" logged, then a 120s hang).
    url: "http://localhost:4321/harness-walle",
    reuseExistingServer: true,
    // 120s, not 60s: right after a fresh `yarn install` (no warm Vite dep-optimization cache),
    // cold astro dev boot has been observed to take 50s+; 60s left too little margin on CI.
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
