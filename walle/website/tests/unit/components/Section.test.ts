import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Section from "../../../src/@walle/components/features/Sections/Section.astro";

describe("Section", () => {
  it("renders without crashing with just a title", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Section, { props: { title: "Section title" } });
    expect(html).toContain("Section title");
  });

  it("renders the image when passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Section, {
      props: { title: "With image", image: { src: "/img/demo.jpg", alt: "Demo" } },
    });
    expect(html).toContain("image-container");
  });

  it("the title slot forwarded to SectionWrapper wins over the title prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Section, {
      props: { title: "Prop title" },
      slots: { title: "Events in <em>Latina</em>" },
    });
    expect(html).not.toContain("Prop title");
    expect(html).toContain("Events in <em>Latina</em>");
  });

  it("muted maps to data-muted without data-filled", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Section, {
      props: { title: "Muted section", muted: true },
    });
    expect(html).toContain("data-muted");
    expect(html).not.toContain("data-filled");
  });

  it("filled maps to data-filled without data-muted", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Section, {
      props: { title: "Filled section", filled: true },
    });
    expect(html).toContain("data-filled");
    expect(html).not.toContain("data-muted");
  });
});
