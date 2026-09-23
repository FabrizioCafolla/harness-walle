import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import SectionColumns from "../../../src/@walle/components/features/Sections/SectionColumns.astro";

describe("SectionColumns", () => {
  it("renders without crashing and contains the column content", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionColumns, {
      props: { title: "Layout" },
      slots: { default: '<div class="feature">Column content</div>' },
    });
    expect(html).toContain("Column content");
    expect(html).toContain("section-columns__grid");
  });

  it("the title slot forwarded to SectionWrapper wins over the title prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionColumns, {
      props: { title: "Prop title" },
      slots: { title: "Events in <em>Latina</em>" },
    });
    expect(html).not.toContain("Prop title");
    expect(html).toContain("Events in <em>Latina</em>");
  });

  it("muted maps to data-muted without data-filled", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionColumns, {
      props: { title: "Layout", muted: true },
    });
    expect(html).toContain("data-muted");
    expect(html).not.toContain("data-filled");
  });

  it("filled maps to data-filled without data-muted", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionColumns, {
      props: { title: "Layout", filled: true },
    });
    expect(html).toContain("data-filled");
    expect(html).not.toContain("data-muted");
  });
});
