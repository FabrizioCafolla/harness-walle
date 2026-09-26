import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ProductCard from "../../../src/@walle/components/features/Card/ProductCard.astro";

const baseProduct = {
  name: "Sample product",
  image: { src: "https://example.com/photo.jpg", alt: "Sample" },
  price: { amount: 49.9, currency: "EUR" },
  href: "/products/sample",
};

describe("ProductCard", () => {
  it("defaults to variant primary", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductCard, {
      props: { product: baseProduct },
    });
    expect(html).toContain('data-variant="primary"');
  });

  it("renders its own data-variant when set", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductCard, {
      props: { product: baseProduct, variant: "secondary" },
    });
    expect(html).toContain('data-variant="secondary"');
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductCard, {
      props: { product: baseProduct, "data-testid": "my-product-card" },
    });
    expect(html).toContain('data-testid="my-product-card"');
  });

  it("renders the badge when present", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductCard, {
      props: {
        product: { ...baseProduct, badge: { text: "Sale", variant: "secondary" } },
      },
    });
    expect(html).toContain("product-card__badge--secondary");
    expect(html).toContain("Sale");
  });

  it("omits the badge when not present", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProductCard, {
      props: { product: baseProduct },
    });
    expect(html).not.toContain("product-card__badge");
  });
});
