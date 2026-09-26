import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Badge from "../../../src/@walle/components/elements/Badge.astro";

describe("Badge", () => {
  it("defaults to variant primary", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Badge, { props: { text: "Label" } });
    expect(html).toContain('data-variant="primary"');
  });

  it("emits data-outline and data-muted only when true", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Badge, {
      props: { text: "Label", outline: true, muted: true },
    });
    expect(html).toContain('data-outline="true"');
    expect(html).toContain('data-muted="true"');
  });

  it("emits data-status when status is set, taking precedence over variant for coloring", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Badge, {
      props: { text: "Label", variant: "secondary", status: "success" },
    });
    // Both attributes are present: variant still identifies the badge's variant, but the
    // CSS's [data-status] rule has higher specificity than the plain variant mapping, so
    // status wins the coloring. This asserts the markup contract that makes that possible.
    expect(html).toContain('data-variant="secondary"');
    expect(html).toContain('data-status="success"');
  });

  it("omits data-status when status is not set", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Badge, { props: { text: "Label" } });
    expect(html).not.toContain("data-status");
  });

  it("renders as a link when href is set", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Badge, {
      props: { text: "Label", href: "/somewhere" },
    });
    expect(html).toContain("<a");
    expect(html).toContain('href="/somewhere"');
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Badge, {
      props: { text: "Label", "data-testid": "my-badge" },
    });
    expect(html).toContain('data-testid="my-badge"');
  });
});
