import { defineCollection, z } from "astro:content";
import { shopifyLoader } from "../commerce/shopify";

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

/**
 * Collections gated by a walle feature: `products` exists only when commerce is on.
 * `commerceMode` is passed in by the caller (the site's `content.config.ts`).
 *
 * The return type declares `products` always present: an optional or union key makes
 * Astro's generated `content.d.ts` (`Required<>`) infer `unknown` for `getCollection("products")`.
 * A caller that runs regardless of commerce mode (e.g. llms.txt.ts) must check the mode before
 * calling `getCollection("products")`; the injected commerce pages exist only when it is on.
 */
export function walleCollections(commerceMode: string | undefined): { products: typeof products } {
  return (commerceMode === "catalog" || commerceMode === "shop" ? { products } : {}) as {
    products: typeof products;
  };
}
