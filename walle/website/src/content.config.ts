import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

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

export const collections = { posts };
