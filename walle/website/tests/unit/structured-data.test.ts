import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, productJsonLd } from "../../src/@walle/utils/structured-data";

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

// Mirrors the escaping in StructuredData.astro: a "</script>" in untrusted data
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

describe("breadcrumbJsonLd", () => {
  const site = "https://example.com";
  const items = [
    { label: "Home", href: "/" },
    { label: "Rassegne", href: "/news/rassegna" },
    { label: "2026" },
  ];

  it("numbers positions from 1 and resolves hrefs against the site", () => {
    const ld = breadcrumbJsonLd(items, "https://example.com/news/rassegna/2026", site);
    expect(ld["@type"]).toBe("BreadcrumbList");
    const list = ld.itemListElement as { position: number; name: string; item?: string }[];
    expect(list.map((l) => l.position)).toEqual([1, 2, 3]);
    expect(list[0].item).toBe("https://example.com/");
    expect(list[1].item).toBe("https://example.com/news/rassegna");
  });

  it("points the last item at the page URL, even without an href", () => {
    const list = breadcrumbJsonLd(items, "https://example.com/news/rassegna/2026", site)
      .itemListElement as { item?: string }[];
    expect(list[2].item).toBe("https://example.com/news/rassegna/2026");
  });

  it("omits item on a middle entry without a link", () => {
    const list = breadcrumbJsonLd(
      [{ label: "Home", href: "/" }, { label: "Mid" }, { label: "End" }],
      "https://example.com/end",
      site
    ).itemListElement as Record<string, unknown>[];
    expect("item" in list[1]).toBe(false);
  });

  it("trims surrounding whitespace in names", () => {
    const list = breadcrumbJsonLd([{ label: "Open Lab " }], "https://example.com/x", site)
      .itemListElement as { name: string }[];
    expect(list[0].name).toBe("Open Lab");
  });

  it("keeps special characters in names verbatim", () => {
    const list = breadcrumbJsonLd([{ label: 'A & B "</script>"' }], "https://example.com/x", site)
      .itemListElement as { name: string }[];
    expect(list[0].name).toBe('A & B "</script>"');
  });
});
