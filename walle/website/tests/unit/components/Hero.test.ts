import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Hero from "../../../src/@walle/components/features/Sections/Hero.astro";

describe("Hero", () => {
  it("renders exactly one h1 containing the title", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: "Welcome to walle" },
    });
    const h1Matches = html.match(/<h1[^>]*>/g) ?? [];
    expect(h1Matches).toHaveLength(1);
    expect(html).toContain("Welcome to walle");
  });

  it("renders an action as a Button link reflecting its variant and text", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: {
        title: "Title",
        actions: [{ text: "Get started", href: "/start", variant: "secondary" }],
      },
    });
    expect(html).toContain('data-variant="secondary"');
    expect(html).toContain('href="/start"');
    expect(html).toContain("Get started");
  });

  it("renders an action with variant site as data-variant site", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: {
        title: "Title",
        actions: [{ text: "Site action", href: "/site", variant: "site" }],
      },
    });
    expect(html).toContain('data-variant="site"');
  });

  it("omits the actions row when no actions are passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: "Title" },
    });
    expect(html).not.toContain("hero-actions");
  });

  it("passes through arbitrary attributes to the root section", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: "Title", "data-testid": "hero" },
    });
    expect(html).toContain('data-testid="hero"');
  });

  it("the title slot takes precedence over the title prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: "Prop title" },
      slots: { title: "Custom <em>title</em>" },
    });
    expect(html).not.toContain("Prop title");
    expect(html).toContain("Custom <em>title</em>");
  });

  it("the tagline slot takes precedence over the tagline prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: "Title", tagline: "Prop tagline" },
      slots: { tagline: "<em>Slot tagline</em>" },
    });
    expect(html).not.toContain("Prop tagline");
    expect(html).toContain("<em>Slot tagline</em>");
  });

  it("the subtitle slot takes precedence over the subtitle prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: { title: "Title", subtitle: "Prop subtitle" },
      slots: { subtitle: "<strong>Slot subtitle</strong>" },
    });
    expect(html).not.toContain("Prop subtitle");
    expect(html).toContain("<strong>Slot subtitle</strong>");
  });

  it("renders the image as eager and high priority, never lazy", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Hero, {
      props: {
        title: "Title",
        image: { src: "/img/demo.jpg", alt: "Demo" },
      },
    });
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchpriority="high"');
    expect(html).not.toContain('loading="lazy"');
  });
});
