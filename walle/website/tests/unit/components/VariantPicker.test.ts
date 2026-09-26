import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import VariantPicker from "../../../src/@walle/commerce/VariantPicker.astro";
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

describe("VariantPicker", () => {
  it("formats the initial price with the default en-US locale", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(VariantPicker, { props: { product } });
    expect(html).toContain("€10.00");
  });

  it("formats the initial price with it-IT when passed as a locale prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(VariantPicker, {
      props: { product, locale: "it-IT" },
    });
    expect(html).toContain("10,00");
    expect(html).toContain("€");
  });

  it("reflects the locale prop in a data-locale attribute on the root", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(VariantPicker, {
      props: { product, locale: "it-IT" },
    });
    expect(html).toContain('data-locale="it-IT"');
  });

  it("shows In stock for an available variant", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(VariantPicker, { props: { product } });
    expect(html).toContain("In stock");
  });
});
