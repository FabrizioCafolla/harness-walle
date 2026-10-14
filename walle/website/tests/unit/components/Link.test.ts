import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Link from "../../../src/@walle/components/elements/Link.astro";

describe("Link", () => {
  it("emits no data-variant when variant is not passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Link, {
      props: { href: "/blog", text: "Internal" },
    });
    expect(html).not.toContain("data-variant");
  });

  it("emits data-variant with the explicit value when variant is passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Link, {
      props: { href: "/blog", text: "Internal", variant: "secondary" },
    });
    expect(html).toContain('data-variant="secondary"');
  });

  // experimental_AstroContainer never sets `site` (astro@7.1.3), so Astro.site is undefined
  // here: only scheme detection (absolute vs. relative URL) is testable, not same-host.
  it("external link (absolute URL) gets rel=noopener noreferrer and target=_blank", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Link, {
      props: { href: "https://other-host.com/page", text: "External" },
    });
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it("relative internal link gets no rel", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Link, {
      props: { href: "/blog", text: "Internal" },
    });
    expect(html).not.toContain("rel=");
  });

  it("emits data-muted and data-unstyled only when true", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Link, {
      props: { href: "/blog", text: "Internal", muted: true, unstyled: true },
    });
    expect(html).toContain('data-muted="true"');
    expect(html).toContain('data-unstyled="true"');
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Link, {
      props: { href: "/blog", text: "Internal", "data-testid": "my-link" },
    });
    expect(html).toContain('data-testid="my-link"');
  });
});
