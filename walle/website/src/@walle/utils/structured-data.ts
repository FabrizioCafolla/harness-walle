import type { ProductData } from "@walle/components/features/Card/ProductCard.astro";

/**
 * schema.org JSON-LD builders. Rendered via <StructuredData data={...} />.
 * One source of truth: the same objects that feed visible components
 * (e.g. ProductData) produce the structured data.
 */

export type JsonLd = Record<string, unknown>;

interface SiteInfo {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export function websiteJsonLd(site: SiteInfo): JsonLd {
  return {
    "@type": "WebSite",
    name: site.title,
    description: site.description,
    url: site.url,
  };
}

export function organizationJsonLd(site: SiteInfo): JsonLd {
  return {
    "@type": "Organization",
    name: site.title,
    url: site.url,
    ...(site.image ? { logo: site.image } : {}),
  };
}

export function articleJsonLd(article: {
  title: string;
  description?: string;
  url: string;
  publishDate?: Date | string;
  author?: string;
  image?: string;
  tags?: string[];
}): JsonLd {
  return {
    "@type": "Article",
    headline: article.title,
    ...(article.description ? { description: article.description } : {}),
    url: article.url,
    ...(article.publishDate ? { datePublished: new Date(article.publishDate).toISOString() } : {}),
    ...(article.author ? { author: { "@type": "Person", name: article.author } } : {}),
    ...(article.image ? { image: article.image } : {}),
    ...(article.tags?.length ? { keywords: article.tags.join(", ") } : {}),
  };
}

/**
 * BreadcrumbList from the same items the visible trail renders. `href`s resolve against `site`;
 * the last item always points at `pageUrl`. A middle item without `href` gets no `item`.
 */
export function breadcrumbJsonLd(
  items: { label: string; href?: string }[],
  pageUrl: string | URL,
  site: string | URL
): JsonLd {
  const last = items.length - 1;
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => {
      const item = i === last ? String(pageUrl) : it.href ? new URL(it.href, site).href : undefined;
      return {
        "@type": "ListItem",
        position: i + 1,
        name: it.label.trim(),
        ...(item ? { item } : {}),
      };
    }),
  };
}

const SCHEMA_AVAILABILITY: Record<NonNullable<ProductData["availability"]>, string> = {
  in_stock: "https://schema.org/InStock",
  out_of_stock: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
};

export function productJsonLd(product: ProductData, url: string): JsonLd {
  // Local ImageMetadata carries its built path on `.src`; remote sources are
  // already a URL string. Either way the image belongs in the structured data.
  const image = typeof product.image.src === "string" ? product.image.src : product.image.src.src;
  return {
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(image ? { image } : {}),
    url,
    offers: {
      "@type": "Offer",
      price: product.price.amount,
      priceCurrency: product.price.currency,
      availability: SCHEMA_AVAILABILITY[product.availability ?? "in_stock"],
      url,
    },
  };
}
