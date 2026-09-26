import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ProductBuyCard from "../../../src/@walle/commerce/ProductBuyCard.astro";
import type { ShopifyProduct } from "../../../src/@walle/commerce/shopify";

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

describe("ProductBuyCard", () => {
  it("renders the product title", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductBuyCard, { props: { product } });
    expect(html).toContain("Sample product");
  });

  it("passes the locale prop through to the nested VariantPicker's rendered price", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductBuyCard, {
      props: { product, locale: "it-IT" },
    });
    expect(html).toContain("10,00");
    expect(html).toContain("€");
  });

  it("defaults to en-US formatting when no locale prop is passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductBuyCard, { props: { product } });
    expect(html).toContain("€10.00");
  });
});
