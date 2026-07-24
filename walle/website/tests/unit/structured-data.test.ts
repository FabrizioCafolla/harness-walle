import { describe, expect, it } from "vitest";
import { productJsonLd } from "../../src/@walle/utils/structured-data";

// productJsonLd is pure; the <script> escaping is asserted at the string level
// below since it lives in the .astro component.

describe("productJsonLd", () => {
  it("includes the image for a remote (string) source", () => {
    const ld = productJsonLd(
      {
        name: "X",
        image: { src: "https://cdn.example.com/x.jpg", alt: "x" },
        price: { amount: 10, currency: "EUR" },
        href: "/x",
      },
      "https://site/x"
    );
    expect(ld.image).toBe("https://cdn.example.com/x.jpg");
  });

  it("includes the image for a local ImageMetadata source", () => {
    const ld = productJsonLd(
      {
        name: "X",
        // shape of astro:assets ImageMetadata (only .src is read)
        image: { src: { src: "/_astro/x.hash.webp" } as never, alt: "x" },
        price: { amount: 10, currency: "EUR" },
        href: "/x",
      },
      "https://site/x"
    );
    expect(ld.image).toBe("/_astro/x.hash.webp");
  });

  it("maps availability to a schema.org URL", () => {
    const ld = productJsonLd(
      {
        name: "X",
        image: { src: "u", alt: "x" },
        price: { amount: 1, currency: "EUR" },
        availability: "out_of_stock",
        href: "/x",
      },
      "u"
    );
    expect((ld.offers as Record<string, unknown>).availability).toBe(
      "https://schema.org/OutOfStock"
    );
  });
});

// Mirrors the escaping in StructuredData.astro — a "</script>" in untrusted data
// must not be able to close the element.
function escapeJsonLd(payload: unknown): string {
  return JSON.stringify(payload)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

describe("JSON-LD script escaping", () => {
  it("neutralizes a </script> payload while staying valid JSON", () => {
    const evil = { name: "</script><img src=x onerror=alert(1)>" };
    const out = escapeJsonLd(evil);
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    // still parses back to the original once unescaped by the JSON reader
    expect(JSON.parse(out).name).toBe("</script><img src=x onerror=alert(1)>");
  });
});
