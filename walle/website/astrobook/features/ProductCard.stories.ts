import type { ComponentProps } from "astro/types";

import ProductCard from "@walle/components/features/Card/ProductCard.astro";
import StoryWrapper from "../StoryWrapper.astro";

type ProductCardProps = ComponentProps<typeof ProductCard>;

export default {
  component: ProductCard,
  decorators: [{ component: StoryWrapper }],
};

const image = { src: "/harness-walle/img/posts/default.jpg", alt: "Product photo" };

export const Default = {
  args: {
    product: {
      name: "Sample product",
      description: "A short product description shown under the name.",
      image,
      price: { amount: 49.9, currency: "EUR" },
      href: "/products/sample",
    },
  } satisfies ProductCardProps,
};

export const Discounted = {
  args: {
    product: {
      name: "Discounted product",
      image,
      price: { amount: 39.9, currency: "EUR", compareAt: 59.9 },
      badge: { text: "Sale", variant: "secondary" },
      href: "/products/discounted",
    },
  } satisfies ProductCardProps,
};

export const OutOfStock = {
  args: {
    product: {
      name: "Unavailable product",
      description: "Availability is communicated as text, not color alone.",
      image,
      price: { amount: 89, currency: "EUR" },
      availability: "out_of_stock",
      href: "/products/unavailable",
    },
  } satisfies ProductCardProps,
};

export const Preorder = {
  args: {
    product: {
      name: "Preorder product",
      image,
      price: { amount: 129, currency: "EUR" },
      availability: "preorder",
      badge: { text: "New" },
      href: "/products/preorder",
    },
  } satisfies ProductCardProps,
};
