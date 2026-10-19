import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { defineWalleConfig } from "../../src/@walle/define-config";

// Pages import `@walle/config` at runtime. If that module reaches define-config.ts, astro/config
// is bundled into the prerender build and rolldown >= 1.2.13 fails with
// `[PARSE_ERROR] Unterminated string` at `serverIslandPlaceholderMap`.

const WALLE = fileURLToPath(new URL("../../src/@walle/", import.meta.url));
const CONFIG_INDEX = resolve(WALLE, "config/index.ts");
const DEFINE_CONFIG = resolve(WALLE, "define-config.ts");

type LoadPlugin = { name: string; load: (id: string) => string | null };

function runtimeConfigPlugin(): LoadPlugin {
  const plugins = defineWalleConfig().vite!.plugins as unknown as LoadPlugin[];
  const plugin = plugins.find((p) => p.name === "walle-runtime-config");
  expect(plugin, "walle-runtime-config is registered by defineWalleConfig").toBeDefined();
  return plugin!;
}

function resolveLocal(spec: string, from: string): string | null {
  let base: string;
  if (spec.startsWith("@walle/")) base = resolve(WALLE, spec.slice("@walle/".length));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null;
  const candidates = [base, ...[".ts", ".js", "/index.ts", "/index.js"].map((ext) => base + ext)];
  return candidates.find((c) => existsSync(c) && /\.(ts|js|json)$/.test(c)) ?? null;
}

const SPECIFIER = /(?:import|export)\s+(?:type\s+)?(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/g;

/** Every local module and bare specifier reachable from `entry` through static imports. */
function importGraph(entry: string, entrySource: string) {
  const files = new Set<string>();
  const bare = new Set<string>();
  const queue: Array<[string, string]> = [[entry, entrySource]];
  while (queue.length) {
    const [file, source] = queue.pop()!;
    if (files.has(file)) continue;
    files.add(file);
    if (file.endsWith(".json")) continue;
    for (const [, spec] of source.matchAll(SPECIFIER)) {
      const local = resolveLocal(spec, file);
      if (local) queue.push([local, readFileSync(local, "utf8")]);
      else if (!spec.startsWith(".") && !spec.startsWith("@walle/")) bare.add(spec);
    }
  }
  return { files, bare };
}

describe("runtime @walle/config", () => {
  it("still re-exports defineWalleConfig for astro.config.mjs", () => {
    expect(readFileSync(CONFIG_INDEX, "utf8")).toMatch(
      /export \{ defineWalleConfig \} from "\.\.\/define-config"/
    );
  });

  it("is loaded without the defineWalleConfig re-export in the site's Vite graph", () => {
    const plugin = runtimeConfigPlugin();
    const runtime = plugin.load(CONFIG_INDEX);
    expect(runtime).toBeTypeOf("string");
    expect(runtime).not.toMatch(
      /^export\s*\{\s*defineWalleConfig\b|from\s*["']\.\.\/define-config/m
    );
    expect(runtime).toMatch(/export default config;/);
    expect(plugin.load(`${CONFIG_INDEX}?v=1`)).toBe(runtime);
    expect(plugin.load(DEFINE_CONFIG)).toBeNull();
  });

  it("never reaches define-config.ts or astro/config through its imports", () => {
    expect(
      importGraph(CONFIG_INDEX, readFileSync(CONFIG_INDEX, "utf8")).files.has(DEFINE_CONFIG)
    ).toBe(true);
    const { files, bare } = importGraph(CONFIG_INDEX, runtimeConfigPlugin().load(CONFIG_INDEX)!);
    expect(files.has(DEFINE_CONFIG)).toBe(false);
    expect(bare.has("astro/config")).toBe(false);
    expect([...bare].filter((s) => /^@(astrojs|vite-pwa)\//.test(s))).toEqual([]);
  });
});
