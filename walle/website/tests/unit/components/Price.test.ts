import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Price from "../../../src/@walle/components/elements/Price.astro";

describe("Price", () => {
  it("formats with the given it-IT locale (comma decimal separator)", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Price, {
      props: { price: { amount: 39.9, currency: "EUR" }, locale: "it-IT" },
    });
    // it-IT uses a comma decimal separator, e.g. "39,90 €".
    expect(html).toMatch(/39,90/);
  });

  it("defaults locale from config (en-US, dot decimal separator)", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Price, {
      props: { price: { amount: 39.9, currency: "EUR" } },
    });
    expect(html).toMatch(/39\.90/);
  });

  it("renders the compare-at price struck through when discounted", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Price, {
      props: { price: { amount: 39.9, currency: "EUR", compareAt: 59.9 }, locale: "en-US" },
    });
    expect(html).toContain("<s");
    expect(html).toMatch(/59\.90/);
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Price, {
      props: { price: { amount: 10, currency: "EUR" }, "data-testid": "my-price" },
    });
    expect(html).toContain('data-testid="my-price"');
  });
});
