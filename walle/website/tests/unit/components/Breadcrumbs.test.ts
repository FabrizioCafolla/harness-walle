import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Breadcrumbs from "../../../src/@walle/components/features/Breadcrumbs.astro";

describe("Breadcrumbs", () => {
  it("renders each item's label", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Breadcrumbs, {
      props: { items: [{ label: "Home", href: "/" }, { label: "Blog" }] },
    });
    expect(html).toContain("Home");
    expect(html).toContain("Blog");
  });

  it("renders a link with href for non-last items", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Breadcrumbs, {
      props: { items: [{ label: "Home", href: "/" }, { label: "Blog" }] },
    });
    expect(html).toContain('<a href="/"');
  });

  it("renders the last item as a span, not a link, with aria-current", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Breadcrumbs, {
      props: { items: [{ label: "Home", href: "/" }, { label: "Blog" }] },
    });
    expect(html).toContain('aria-current="page"');
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Breadcrumbs, {
      props: {
        items: [{ label: "Home", href: "/" }],
        "data-testid": "my-breadcrumbs",
      },
    });
    expect(html).toContain('data-testid="my-breadcrumbs"');
  });
});
