import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

// Isolated in its own file: mocking @walle/config here would otherwise leak into every
// other test that imports Head.astro via vi.mock's file-scoped hoisting.
vi.mock("@walle/config", () => ({
  default: {
    app: {
      website: { title: "Example", description: "Example site" },
      seo: {
        alternates: [
          { href: "/rss.xml", type: "application/rss+xml" },
          { href: "/atom.xml", type: "application/atom+xml", title: "Atom feed" },
        ],
      },
    },
  },
}));

const { default: Head } = await import("../../../src/@walle/components/features/Head.astro");

describe("Head seo.alternates", () => {
  it("renders one link rel=alternate per entry, with its own type", async () => {
    const container = await AstroContainer.create({ astroConfig: { site: "https://example.com" } });
    const html = await container.renderToString(Head, {
      request: new Request("https://example.com/page"),
      props: { title: "Page", description: "Page description" },
    });
    expect(html).toContain('rel="alternate"');
    expect(html).toContain('type="application/rss+xml"');
    expect(html).toContain('type="application/atom+xml"');
  });

  it("falls back to website.title when an entry has no title", async () => {
    const container = await AstroContainer.create({ astroConfig: { site: "https://example.com" } });
    const html = await container.renderToString(Head, {
      request: new Request("https://example.com/page"),
      props: { title: "Page", description: "Page description" },
    });
    expect(html).toContain('title="Example"');
    expect(html).toContain('title="Atom feed"');
  });
});
