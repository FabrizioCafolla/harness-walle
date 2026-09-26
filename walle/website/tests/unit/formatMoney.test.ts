import { describe, expect, it } from "vitest";
import { formatMoney } from "../../src/@walle/commerce/shopify";

describe("formatMoney", () => {
  it("formats with en-US locale as a $-prefixed string", () => {
    expect(formatMoney({ amount: "10", currencyCode: "USD" }, "en-US")).toBe("$10.00");
  });

  it("formats with it-IT locale using a comma decimal separator and the euro symbol", () => {
    const formatted = formatMoney({ amount: "10", currencyCode: "EUR" }, "it-IT");
    expect(formatted).toContain("10,00");
    expect(formatted).toContain("€");
  });
});
