import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Every relative markdown link in the repo wiki must point to a file that exists, so a moved or
// deleted page cannot leave dead links behind.
const repoRoot = resolve(__dirname, "../../../..");
const wikiRoot = join(repoRoot, "wiki");

function markdownFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? markdownFiles(path) : path.endsWith(".md") ? [path] : [];
  });
}

function relativeLinks(source: string): string[] {
  const withoutCode = source.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  return [...withoutCode.matchAll(/\]\(([^)\s]+)\)/g)]
    .map((match) => match[1].split("#")[0])
    .filter((href) => href !== "" && !/^[a-z]+:|^\/|^#/i.test(href));
}

describe("wiki links", () => {
  const files = existsSync(wikiRoot) ? markdownFiles(wikiRoot) : [];

  it("finds wiki pages", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${relative(repoRoot, file)} has no dead relative link`, () => {
      const dead = relativeLinks(readFileSync(file, "utf-8")).filter(
        (href) => !existsSync(resolve(dirname(file), href))
      );
      expect(dead).toEqual([]);
    });
  }
});
