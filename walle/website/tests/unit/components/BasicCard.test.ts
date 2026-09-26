import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import BasicCard from "../../../src/@walle/components/features/Card/BasicCard.astro";

describe("BasicCard", () => {
  it("defaults to variant primary", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BasicCard, {
      props: { title: "Title", content: "Content", href: "/somewhere" },
    });
    expect(html).toContain('data-variant="primary"');
  });

  it("renders its own data-variant when set", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BasicCard, {
      props: { title: "Title", content: "Content", href: "/somewhere", variant: "secondary" },
    });
    expect(html).toContain('data-variant="secondary"');
  });

  it("truncates content at the default 120 characters", async () => {
    const container = await AstroContainer.create();
    const longContent = "a".repeat(150);
    const html = await container.renderToString(BasicCard, {
      props: { title: "Title", content: longContent, href: "/somewhere" },
    });
    expect(html).toContain(`${"a".repeat(120)}...`);
    expect(html).not.toContain("a".repeat(121));
  });

  it("truncates content at a custom excerptLength", async () => {
    const container = await AstroContainer.create();
    const content = "a".repeat(30);
    const html = await container.renderToString(BasicCard, {
      props: { title: "Title", content, href: "/somewhere", excerptLength: 10 },
    });
    expect(html).toContain(`${"a".repeat(10)}...`);
    expect(html).not.toContain("a".repeat(11));
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BasicCard, {
      props: {
        title: "Title",
        content: "Content",
        href: "/somewhere",
        "data-testid": "my-card",
      },
    });
    expect(html).toContain('data-testid="my-card"');
  });

  it("renders the badge when present", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BasicCard, {
      props: {
        title: "Title",
        content: "Content",
        href: "/somewhere",
        badge: { text: "News", variant: "secondary" },
      },
    });
    expect(html).toContain("card__badge--secondary");
    expect(html).toContain("News");
  });

  it("omits the badge when not present", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BasicCard, {
      props: { title: "Title", content: "Content", href: "/somewhere" },
    });
    expect(html).not.toContain("card__badge");
  });

  it("formats publishDate via the site locale, not a raw Date string", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BasicCard, {
      props: {
        title: "Title",
        content: "Content",
        href: "/somewhere",
        publishDate: new Date("2024-03-15"),
      },
    });
    expect(html).toContain("card__date");
    expect(html).not.toContain("Fri Mar 15 2024");
  });

  it("omits the date span when publishDate is not set", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BasicCard, {
      props: { title: "Title", content: "Content", href: "/somewhere" },
    });
    expect(html).not.toContain("card__date");
  });
});
