import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import CallToAction from "../../../src/@walle/components/features/Sections/CallToAction.astro";

describe("CallToAction", () => {
  it("applies the cta-card class by default (card layout)", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: { title: "Title" },
    });
    expect(html).toContain("cta-card");
  });

  it("does not apply the cta-card class with layout banner", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: { title: "Title", layout: "banner" },
    });
    expect(html).not.toContain("cta-card");
  });

  it("defaults actions to inverse when layout is banner and filled is true", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: {
        title: "Title",
        layout: "banner",
        filled: true,
        actions: [{ text: "Get started", href: "/start" }],
      },
    });
    expect(html).toContain('data-inverse="true"');
  });

  it("defaults actions to inverse when layout is card and filled is true", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: {
        title: "Title",
        layout: "card",
        filled: true,
        actions: [{ text: "Get started", href: "/start" }],
      },
    });
    expect(html).toContain('data-inverse="true"');
  });

  it("does not default actions to inverse when layout is card without filled", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: {
        title: "Title",
        layout: "card",
        actions: [{ text: "Get started", href: "/start" }],
      },
    });
    expect(html).not.toContain('data-inverse="true"');
  });

  it("an action's own explicit inverse overrides the filled default", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: {
        title: "Title",
        layout: "card",
        filled: true,
        actions: [{ text: "Get started", href: "/start", inverse: false }],
      },
    });
    expect(html).not.toContain('data-inverse="true"');
  });

  it("card layout with filled paints the card, not the band, so text and background share the same variant colors", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: { title: "Title", layout: "card", filled: true },
    });
    expect(html).toContain("cta-layout-card");
    expect(html).toContain("cta-card");
  });

  it("does not default actions to inverse when layout is banner without filled", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: {
        title: "Title",
        layout: "banner",
        actions: [{ text: "Get started", href: "/start" }],
      },
    });
    expect(html).not.toContain('data-inverse="true"');
  });

  it("the title slot takes precedence over the title prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: { title: "Prop title" },
      slots: { title: "Custom <em>title</em>" },
    });
    expect(html).not.toContain("Prop title");
    expect(html).toContain("Custom <em>title</em>");
  });

  it("the subtitle slot takes precedence over the subtitle prop", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: { title: "Title", subtitle: "Prop subtitle" },
      slots: { subtitle: "<strong>Slot subtitle</strong>" },
    });
    expect(html).not.toContain("Prop subtitle");
    expect(html).toContain("<strong>Slot subtitle</strong>");
  });

  it("omits the actions row when no actions are passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: { title: "Title" },
    });
    expect(html).not.toContain("cta-actions");
  });

  it("passes through arbitrary attributes to the root section", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CallToAction, {
      props: { title: "Title", "data-testid": "cta" },
    });
    expect(html).toContain('data-testid="cta"');
  });
});
