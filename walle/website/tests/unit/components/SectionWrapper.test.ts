import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import SectionWrapper from "../../../src/@walle/components/features/Sections/SectionWrapper.astro";

const source = readFileSync(
  join(__dirname, "../../../src/@walle/components/features/Sections/SectionWrapper.astro"),
  "utf-8"
);

describe("SectionWrapper", () => {
  // [data-filled] sets --link to --variant-fg, the same color as surrounding text, and
  // base.css strips the underline (`a { text-decoration: none }`). Without this rule an
  // inline link in filled-section prose would be distinguishable by nothing (WCAG 1.4.1).
  // AstroContainer.renderToString does not bundle scoped <style> output, so the only way to
  // guard the rule here is to assert it is present in the component's own source.
  it("underlines unstyled links in filled sections (WCAG 1.4.1)", () => {
    expect(source).toMatch(
      /\.section-wrapper\[data-filled\]\s+a:not\(\[class\]\)\s*\{\s*text-decoration:\s*underline;\s*\}/
    );
  });

  it("defaults to variant primary", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, { props: {} });
    expect(html).toContain('data-variant="primary"');
  });

  it("emits data-filled and data-muted only when true", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, {
      props: { filled: true, muted: true },
    });
    expect(html).toContain("data-filled");
    expect(html).toContain("data-muted");
  });

  it("omits data-filled and data-muted when false", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, { props: {} });
    expect(html).not.toContain("data-filled");
    expect(html).not.toContain("data-muted");
  });

  it("renders the title from the title prop when no slot is given", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, {
      props: { title: "Section title" },
    });
    expect(html).toContain("Section title");
    expect(html).toContain("section-wrapper__title");
  });

  it("the title slot takes precedence over the title prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, {
      props: { title: "Prop title" },
      slots: { title: "Events in <em>Latina</em>" },
    });
    expect(html).not.toContain("Prop title");
    expect(html).toContain("Events in <em>Latina</em>");
  });

  it("the tagline slot takes precedence over the tagline prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, {
      props: { tagline: "Prop tagline" },
      slots: { tagline: "<em>Slot tagline</em>" },
    });
    expect(html).not.toContain("Prop tagline");
    expect(html).toContain("<em>Slot tagline</em>");
  });

  it("the subtitle slot takes precedence over the subtitle prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, {
      props: { subtitle: "Prop subtitle" },
      slots: { subtitle: "<strong>Slot subtitle</strong>" },
    });
    expect(html).not.toContain("Prop subtitle");
    expect(html).toContain("<strong>Slot subtitle</strong>");
  });

  it("a title slot that renders empty falls back to the title prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, {
      props: { title: "Prop title" },
      slots: { title: "" },
    });
    expect(html).toContain("Prop title");
  });

  it("renders no title element when neither the title prop nor the title slot is given", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, { props: {} });
    expect(html).not.toContain("section-wrapper__title");
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("<h2");
  });

  it("renders an h1 when headingLevel is h1", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, {
      props: { title: "Title", headingLevel: "h1" },
    });
    expect(html).toContain("<h1");
  });

  it("renders an h2 by default", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, {
      props: { title: "Title" },
    });
    expect(html).toContain("<h2");
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionWrapper, {
      props: { "data-testid": "my-section" },
    });
    expect(html).toContain('data-testid="my-section"');
  });
});
