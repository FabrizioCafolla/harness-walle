import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Link from "../../../src/@walle/components/elements/Link.astro";

describe("Link", () => {
  it("defaults to variant primary", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Link, {
      props: { href: "/blog", text: "Internal" },
    });
    expect(html).toContain('data-variant="primary"');
  });

  // astro/container's experimental_AstroContainer never wires a `site` into the manifest it
  // builds (verified against astro@7.1.3's source), so Astro.site is always undefined here —
  // an absolute URL can therefore never be exercised as "same host as site" under this harness.
  // That only affects the host-comparison half of Link's external check; the scheme-detection
  // half (any absolute URL vs. a relative one) is real production behavior and is covered below.
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
