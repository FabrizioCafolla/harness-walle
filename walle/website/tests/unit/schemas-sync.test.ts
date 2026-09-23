import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { generateSchemas } from "../../../cli/generate-schemas.mjs";

/**
 * Keeps the committed schemas/*.schema.json in sync with the zod schemas they're generated
 * from (walle/cli/generate-schemas.mjs, run via `just schemas`). Fails if someone hand-edits
 * a committed schema file, or changes config/schema.ts without regenerating.
 */
describe("committed schemas match the generated output", () => {
  const generated = generateSchemas();

  for (const file of Object.keys(generated)) {
    it(`schemas/${file} is up to date`, () => {
      const committed = JSON.parse(readFileSync(join(__dirname, "../../schemas", file), "utf-8"));
      expect(committed).toEqual(generated[file]);
    });
  }
});
