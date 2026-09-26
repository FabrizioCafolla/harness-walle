import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Carousel from "../../../src/@walle/components/features/Carousel.astro";

describe("Carousel", () => {
  it("renders a region with the given accessible label", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Carousel, { props: { label: "Gallery" } });
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Gallery"');
  });

  it("reflects the perView prop in data-per-view", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Carousel, {
      props: { label: "Gallery", perView: 3 },
    });
    expect(html).toContain('data-per-view="3"');
  });

  it("renders prev/next controls by default", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Carousel, { props: { label: "Gallery" } });
    expect(html).toContain("carousel-prev");
    expect(html).toContain("carousel-next");
  });

  it("omits prev/next controls when controls is false", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Carousel, {
      props: { label: "Gallery", controls: false },
    });
    expect(html).not.toContain("carousel-prev");
    expect(html).not.toContain("carousel-next");
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Carousel, {
      props: { label: "Gallery", "data-testid": "my-carousel" },
    });
    expect(html).toContain('data-testid="my-carousel"');
  });
});
