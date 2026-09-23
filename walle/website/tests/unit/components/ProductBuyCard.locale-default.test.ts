import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
import type { ShopifyProduct } from "../../../src/@walle/commerce/shopify";

// Isolated in its own file: mocking @walle/config's website.language here would otherwise
// leak into every other test in ProductBuyCard.test.ts via vi.mock's file-scoped hoisting.
vi.mock("@walle/config", () => ({
  default: { app: { website: { language: "it-IT" } } },
}));

const { default: ProductBuyCard } = await import("../../../src/@walle/commerce/ProductBuyCard.astro");

const product: ShopifyProduct = {
  id: "gid://shopify/Product/1",
  handle: "sample",
  title: "Sample product",
  descriptionHtml: "",
  updatedAt: "",
  productType: "",
  tags: [],
  seo: { title: null, description: null },
  options: [],
  featuredImage: null,
  images: { nodes: [] },
  variants: {
    nodes: [
      {
        id: "gid://shopify/ProductVariant/1",
        title: "Default Title",
        availableForSale: true,
        selectedOptions: [],
        price: { amount: "10", currencyCode: "EUR" },
        compareAtPrice: null,
        image: null,
      },
    ],
  },
  recommended: [],
};

describe("ProductBuyCard locale default (no locale prop)", () => {
  it("formats the price with the configured website.language, not a hardcoded en-US", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductBuyCard, { props: { product } });
    expect(html).toContain("10,00");
    expect(html).toContain("€");
  });
});
