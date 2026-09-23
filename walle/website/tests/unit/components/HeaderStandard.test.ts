import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import HeaderStandard from "../../../src/@walle/components/features/Sections/HeaderStandard.astro";

describe("HeaderStandard", () => {
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
