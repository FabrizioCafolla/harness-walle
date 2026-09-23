import { existsSync } from "node:fs";
import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";
import { walleCollections } from "@walle/content";
import appConfig from "./configs/app.json";

const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string().optional(),
    tags: z.array(z.string().max(24)).min(1).max(10).optional(),
    publishDate: z.date().optional(),
    readingTime: z.string().optional(),
    author: z.string().optional(),
    image: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

/**
 * The design-system wiki (repo-root `wiki/*.md`) rendered into the showcase site at /wiki, so the
 * docs are consultable from the running site. This starter is also seeded to consumer projects,
 * which have no such folder — so the base is guarded: when `../../wiki` is absent the loader points
 * at a pattern that matches nothing, yielding an empty collection instead of a build error. The
 * /wiki pages are in `website-seed-exclude`, so a consumer never ships this UI.
 */
const hasWiki = existsSync("../../wiki");
const wiki = defineCollection({
  loader: glob({
    base: hasWiki ? "../../wiki" : "./src",
    pattern: hasWiki ? "*.md" : "__no_wiki__/*.md",
  }),
});

export const collections = { posts, wiki, ...walleCollections(appConfig.commerce?.mode) };
