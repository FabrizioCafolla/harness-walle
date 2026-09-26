import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv";

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

describe("removed config keys stay rejected in the JSON schema", () => {
  const validate = new Ajv({ strict: false }).compile(generateSchemas()["app.schema.json"]);
  const base = JSON.parse(readFileSync(join(__dirname, "../../src/configs/app.json"), "utf-8"));

  it("accepts the demo config", () => {
    expect(validate(base)).toBe(true);
  });

  it.each([
    ["astro", "ssr", { enabled: true }],
    ["commerce", "showBuyButton", true],
    ["commerce", "locale", "it-IT"],
    ["commerce", "addToCartLabel", "Add"],
  ])("rejects %s.%s", (section, key, value) => {
    const config = structuredClone(base);
    config[section] = { ...config[section], [key]: value };
    expect(validate(config)).toBe(false);
  });
});
