#!/usr/bin/env node
// Regenerates walle/website/schemas/*.schema.json from the zod schemas in
// walle/website/src/@walle/config/schema.ts, for validate-configs.mjs (ajv, no zod/TS import).
// Paths resolve relative to this file, not the caller's cwd.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// `z` is imported via schema.ts, not "astro/zod": Node resolves bare specifiers from the
// importing file, and walle/cli has no node_modules (astro lives in walle/website).
import {
  appSchema,
  footerSchema,
  navbarSchema,
  themeSchema,
  z,
} from "../website/src/@walle/config/schema.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = resolve(__dirname, "../website/schemas");

// z.toJSONSchema does not emit $id/title. `io: "input"` matches what ajv validates: the raw
// file before zod defaults, so a `.default()` field (e.g. commerce.mode) stays optional.
const targets = [
  {
    schema: appSchema,
    file: "app.schema.json",
    id: "https://walle.dev/schemas/app.schema.json",
    title: "Walle app config (src/configs/app.json)",
  },
  {
    schema: navbarSchema,
    file: "navbar.schema.json",
    id: "https://walle.dev/schemas/navbar.schema.json",
    title: "Walle navbar config (src/configs/navbar.json)",
  },
  {
    schema: footerSchema,
    file: "footer.schema.json",
    id: "https://walle.dev/schemas/footer.schema.json",
    title: "Walle footer config (src/configs/footer.json)",
  },
  {
    schema: themeSchema,
    file: "theme.schema.json",
    id: "https://walle.dev/schemas/theme.schema.json",
    title: "Walle theme tokens (src/configs/theme.json)",
  },
];

/**
 * Regenerates all four schema files in memory, keyed by file name. Also used by
 * tests/unit/schemas-sync.test.ts.
 *
 * @returns {Record<string, object>}
 */
export function generateSchemas() {
  const result = {};
  for (const { schema, file, id, title } of targets) {
    const { $schema, ...jsonSchema } = z.toJSONSchema(schema, { target: "draft-7", io: "input" });
    result[file] = { $schema, $id: id, title, ...jsonSchema };
  }
  return result;
}

function main() {
  const schemas = generateSchemas();
  for (const [file, content] of Object.entries(schemas)) {
    writeFileSync(resolve(schemasDir, file), `${JSON.stringify(content, null, 2)}\n`, "utf8");
    console.log(`✓ ${file}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
