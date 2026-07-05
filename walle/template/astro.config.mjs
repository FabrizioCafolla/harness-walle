// @ts-check
import { defineWalleConfig } from "./src/@walle/config";

// Thin consumer-owned shell. All walle logic (SSR flag, default integrations,
// variant resolution, theme tokens) lives in src/@walle/config (updatable zone).
// Pass native Astro overrides here: scalar keys override walle's resolved values;
// `integrations` are merged additively onto the walle defaults (mdx, sitemap, icon).
export default defineWalleConfig({});
