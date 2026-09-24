import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import HeaderStandard from "../../../src/@walle/components/features/Sections/HeaderStandard.astro";

const source = readFileSync(
  join(__dirname, "../../../src/@walle/components/features/Sections/HeaderStandard.astro"),
  "utf-8"
);

describe("HeaderStandard", () => {
  // imageRight defaults to false, meaning the image sits before the text: without this pair
  // of rules the image and text share the same source order in every case (AstroContainer
  // does not bundle scoped <style> output, so this is a source-text guard, not a render one).
  it("imageRight actually reorders the image relative to the text", () => {
    expect(source).toMatch(/\.header-grid\.has-image \.header-media\s*\{\s*order:\s*-1;\s*\}/);
    expect(source).toMatch(
      /\.header-grid\.has-image\.image-right \.header-media\s*\{\s*order:\s*1;\s*\}/
    );
  });

  it("renders without crashing and produces an h1, not an h2", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(HeaderStandard, {
      props: { title: "Page title" },
    });
    expect(html).toContain("<h1");
    expect(html).not.toContain("<h2");
  });

  it("renders the image when passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(HeaderStandard, {
      props: { title: "With image", image: { src: "/img/demo.jpg", alt: "Demo" } },
    });
    expect(html).toContain("header-media");
  });

  it("the title slot forwarded to SectionWrapper wins over the title prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(HeaderStandard, {
      props: { title: "Prop title" },
      slots: { title: "Events in <em>Latina</em>" },
    });
    expect(html).not.toContain("Prop title");
    expect(html).toContain("Events in <em>Latina</em>");
  });

  it("filled maps to data-filled and defaults to not filled (old white default)", async () => {
    const container = await AstroContainer.create();
    const defaultHtml = await container.renderToString(HeaderStandard, {
      props: { title: "Default header" },
    });
    expect(defaultHtml).not.toContain("data-filled");

    const filledHtml = await container.renderToString(HeaderStandard, {
      props: { title: "Filled header", variant: "secondary", filled: true },
    });
    expect(filledHtml).toContain("data-filled");
    expect(filledHtml).toContain('data-variant="secondary"');
  });
});
