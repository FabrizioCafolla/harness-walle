import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Button from "../../../src/@walle/components/elements/Button.astro";

describe("Button", () => {
  it("renders an <a> when href is set", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, {
      props: { text: "Go", href: "/somewhere" },
    });
    expect(html).toContain("<a");
    expect(html).toContain('href="/somewhere"');
  });

  it('renders a <button type="button"> when href is not set', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, { props: { text: "Click" } });
    expect(html).toContain("<button");
    expect(html).toContain('type="button"');
  });

  it("defaults to variant primary", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, { props: { text: "Click" } });
    expect(html).toContain('data-variant="primary"');
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, {
      props: { text: "Click", "data-testid": "my-button" },
    });
    expect(html).toContain('data-testid="my-button"');
  });

  it("emits data-outline and data-inverse only when true", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, {
      props: { text: "Click", outline: true, inverse: true },
    });
    expect(html).toContain('data-outline="true"');
    expect(html).toContain('data-inverse="true"');
  });
});
