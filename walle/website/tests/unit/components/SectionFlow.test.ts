import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import SectionFlow from "../../../src/@walle/components/features/Sections/SectionFlow.astro";

const steps = [
  { number: 1, title: "Install", description: "Run the CLI to scaffold the project." },
  { number: 2, title: "Configure", description: "Edit config files to match your brand." },
];

describe("SectionFlow", () => {
  it("renders without crashing and lists the steps", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionFlow, {
      props: { title: "How it works", steps },
    });
    expect(html).toContain("Install");
    expect(html).toContain("Configure");
  });

  it("the title slot forwarded to SectionWrapper wins over the title prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionFlow, {
      props: { title: "Prop title", steps },
      slots: { title: "Events in <em>Latina</em>" },
    });
    expect(html).not.toContain("Prop title");
    expect(html).toContain("Events in <em>Latina</em>");
  });

  it("muted maps to data-muted without data-filled", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionFlow, {
      props: { title: "How it works", steps, muted: true },
    });
    expect(html).toContain("data-muted");
    expect(html).not.toContain("data-filled");
  });

  it("filled maps to data-filled without data-muted", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionFlow, {
      props: { title: "How it works", steps, filled: true },
    });
    expect(html).toContain("data-filled");
    expect(html).not.toContain("data-muted");
  });
});
