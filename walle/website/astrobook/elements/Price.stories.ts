import type { ComponentProps } from "astro/types";

import Price from "@walle/components/elements/Price.astro";
import StoryWrapper from "../StoryWrapper.astro";

type PriceProps = ComponentProps<typeof Price>;

export default {
  component: Price,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: { price: { amount: 49.9, currency: "EUR" } } satisfies PriceProps,
};

export const Discounted = {
  args: { price: { amount: 39.9, currency: "EUR", compareAt: 59.9 } } satisfies PriceProps,
};

export const OtherLocale = {
  args: {
    price: { amount: 1299, currency: "USD" },
    locale: "en-US",
  } satisfies PriceProps,
};

export const Small = {
  args: { price: { amount: 9.9, currency: "EUR" }, size: "small" } satisfies PriceProps,
};

export const Large = {
  args: {
    price: { amount: 149, currency: "EUR", compareAt: 199 },
    size: "large",
  } satisfies PriceProps,
};
