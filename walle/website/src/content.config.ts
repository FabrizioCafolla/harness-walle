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
    // Required: the seeded RSS feed orders and dates its items by it.
    publishDate: z.date(),
    readingTime: z.string().optional(),
    author: z.string().optional(),
    image: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

/**
 * The design-system wiki (every markdown file under the repo-root `wiki/`, ids keep the
 * directory) rendered at /wiki.
 * Consumer projects have no such folder, so the loader then matches nothing instead of failing;
 * the /wiki pages are in `website-seed-exclude`.
 */
const hasWiki = existsSync("../../wiki");
const wiki = defineCollection({
  loader: glob({
    base: hasWiki ? "../../wiki" : "./src",
    pattern: hasWiki ? "**/*.md" : "__no_wiki__/*.md",
  }),
  schema: z.object({
    title: z.string().optional(),
    order: z.number().int().optional(),
  }),
});

export const collections = { posts, wiki, ...walleCollections(appConfig.commerce?.mode) };
