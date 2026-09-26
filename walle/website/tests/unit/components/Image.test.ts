import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Image from "../../../src/@walle/components/elements/Image.astro";
// A real local asset so astro:assets has something to optimize.
import localImage from "../../../src/content/posts/blog-demo-1.jpg";

describe("Image", () => {
  it("renders a plain <img> for a remote (string) source", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Image, {
      props: {
        image: { src: "https://example.com/photo.jpg", alt: "Remote" },
        width: 480,
        height: 320,
      },
    });
    expect(html).toContain("<img");
    expect(html).toContain('src="https://example.com/photo.jpg"');
  });

  it("throws for a remote source missing width/height", async () => {
    const container = await AstroContainer.create();
    await expect(
      container.renderToString(Image, {
        props: { image: { src: "https://example.com/photo.jpg", alt: "Remote" } },
      })
    ).rejects.toThrow(/width and height/);
  });

  it("renders an optimized <img> for a local (ImageMetadata) source", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Image, {
      props: { image: { src: localImage, alt: "Local" } },
    });
    expect(html).toContain("<img");
    expect(html).toContain('alt="Local"');
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Image, {
      props: {
        image: { src: "https://example.com/photo.jpg", alt: "Remote" },
        width: 480,
        height: 320,
        "data-testid": "my-image",
      },
    });
    expect(html).toContain('data-testid="my-image"');
  });
});
