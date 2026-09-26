import type { ComponentProps } from "astro/types";

import CallToAction from "@walle/components/features/Sections/CallToAction.astro";
import StoryWrapper from "../StoryWrapper.astro";

type CallToActionProps = ComponentProps<typeof CallToAction>;

export default {
  component: CallToAction,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: {
    title: "Ready to get started?",
    subtitle: "Boxed card layout with the default surface chrome.",
    actions: [{ text: "Get started", href: "/start" }],
  } satisfies CallToActionProps,
};

export const Banner = {
  args: {
    title: "Ready to get started?",
    subtitle: "Full-width band, no boxed chrome.",
    actions: [{ text: "Get started", href: "/start" }],
    layout: "banner",
  } satisfies CallToActionProps,
};

export const BannerFilled = {
  args: {
    title: "Ready to get started?",
    subtitle: "Actions default to the inverse modifier on a filled banner.",
    actions: [
      { text: "Get started", href: "/start" },
      { text: "Learn more", href: "/docs", variant: "secondary" },
    ],
    layout: "banner",
    filled: true,
  } satisfies CallToActionProps,
};

export const CardFilledPrimary = {
  args: {
    title: "Ready to get started?",
    subtitle: "Boxed card painted in the variant color, actions default to inverse.",
    actions: [
      { text: "Get started", href: "/start" },
      { text: "Learn more", href: "/docs", variant: "secondary" },
    ],
    layout: "card",
    variant: "primary",
    filled: true,
  } satisfies CallToActionProps,
};

export const CardFilledSecondary = {
  args: {
    title: "Ready to get started?",
    subtitle: "Boxed card painted in the secondary variant color.",
    actions: [
      { text: "Get started", href: "/start" },
      { text: "Learn more", href: "/docs", variant: "primary" },
    ],
    layout: "card",
    variant: "secondary",
    filled: true,
  } satisfies CallToActionProps,
};

export const CardFilledAlternative = {
  args: {
    title: "Ready to get started?",
    subtitle: "Boxed card painted in the alternative variant color.",
    actions: [
      { text: "Get started", href: "/start" },
      { text: "Learn more", href: "/docs", variant: "primary" },
    ],
    layout: "card",
    variant: "alternative",
    filled: true,
  } satisfies CallToActionProps,
};

export const CardFilledSite = {
  args: {
    title: "Ready to get started?",
    subtitle: "Boxed card painted in the site variant color.",
    actions: [
      { text: "Get started", href: "/start" },
      { text: "Learn more", href: "/docs", variant: "primary" },
    ],
    layout: "card",
    variant: "site",
    filled: true,
  } satisfies CallToActionProps,
};

export const Muted = {
  args: {
    title: "Ready to get started?",
    subtitle: "A quieter background for a less prominent call to action.",
    actions: [{ text: "Get started", href: "/start" }],
    muted: true,
  } satisfies CallToActionProps,
};
