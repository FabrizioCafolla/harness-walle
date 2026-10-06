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

  const items = [{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: "Post" }];
  const render = async (props: Record<string, unknown>) =>
    (await AstroContainer.create()).renderToString(Breadcrumbs, {
      props: { items, ...props },
      request: new Request("https://example.com/blog/post"),
    });
  const ldOf = (html: string) =>
    JSON.parse(html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)![1]);

  it("emits a BreadcrumbList matching the visible items and order", async () => {
    const ld = ldOf(await render({}));
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Home", "Blog", "Post"]);
    expect(ld.itemListElement[2].item).toBe("https://example.com/blog/post");
  });

  it("emits no JSON-LD with jsonLd={false}", async () => {
    expect(await render({ jsonLd: false })).not.toContain("application/ld+json");
  });

  it("escapes </script> in labels", async () => {
    const html = await render({ items: [{ label: "</script><b>" }] });
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });

  it("leaves the visible markup unchanged", async () => {
    const strip = (h: string) => h.slice(h.indexOf("<nav"));
    expect(strip(await render({}))).toBe(strip(await render({ jsonLd: false })));
  });
});
