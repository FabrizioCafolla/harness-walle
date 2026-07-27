import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";
import { shopifyLoader } from "@walle/commerce/shopify";

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
 * Products, sourced from the Shopify Storefront API at build time (or a bundled
 * fixture when the store env vars are absent). See @walle/commerce/shopify.ts.
 */
const image = z.object({
  url: z.string(),
  altText: z.string().nullable(),
  width: z.number().optional(),
  height: z.number().optional(),
});
const money = z.object({ amount: z.string(), currencyCode: z.string() });

const products = defineCollection({
  loader: shopifyLoader(),
  schema: z.object({
    id: z.string(),
    handle: z.string(),
    title: z.string(),
    descriptionHtml: z.string(),
    updatedAt: z.string(),
    productType: z.string().default(""),
    tags: z.array(z.string()).default([]),
    seo: z.object({ title: z.string().nullable(), description: z.string().nullable() }),
    options: z.array(
      z.object({ name: z.string(), optionValues: z.array(z.object({ name: z.string() })) })
    ),
    featuredImage: image.nullable(),
    images: z.object({ nodes: z.array(image) }),
    variants: z.object({
      nodes: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          availableForSale: z.boolean(),
          selectedOptions: z.array(z.object({ name: z.string(), value: z.string() })),
          price: money,
          compareAtPrice: money.nullable(),
          image: z.object({ url: z.string(), altText: z.string().nullable() }).nullable(),
        })
      ),
    }),
    recommended: z.array(z.string()).default([]),
  }),
});

export const collections = { posts, products };
