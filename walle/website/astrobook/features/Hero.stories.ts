import type { ComponentProps } from "astro/types";

import Hero from "@walle/components/features/Sections/Hero.astro";
import StoryWrapper from "../StoryWrapper.astro";

type HeroProps = ComponentProps<typeof Hero>;

export default {
  component: Hero,
  decorators: [{ component: StoryWrapper }],
};

const image = { src: "/img/posts/default.svg", alt: "Sample hero image" };

export const Default = {
  args: {
    tagline: "New release",
    title: "Build sites faster with walle",
    subtitle: "A design system and component library for Astro projects.",
    actions: [
      { text: "Get started", href: "/start", variant: "primary" },
      { text: "Learn more", href: "/docs", variant: "secondary" },
    ],
  } satisfies HeroProps,
};

export const WithImageStart = {
  args: {
    title: "Image on the start side",
    subtitle: "The image sits before the text content at desktop width.",
    actions: [{ text: "Get started", href: "/start" }],
    image,
    imagePosition: "start",
  } satisfies HeroProps,
};

export const WithImageEnd = {
  args: {
    title: "Image on the end side",
    subtitle: "The image sits after the text content at desktop width.",
    actions: [{ text: "Get started", href: "/start" }],
    image,
    imagePosition: "end",
  } satisfies HeroProps,
};

export const FilledPrimary = {
  args: {
    title: "Filled primary hero",
    subtitle: "Uses the primary variant with a filled background.",
    actions: [{ text: "Get started", href: "/start", variant: "site" }],
    variant: "primary",
    filled: true,
  } satisfies HeroProps,
};

export const FilledSecondary = {
  args: {
    title: "Filled secondary hero",
    subtitle: "Uses the secondary variant with a filled background.",
    actions: [{ text: "Get started", href: "/start", variant: "site" }],
    variant: "secondary",
    filled: true,
  } satisfies HeroProps,
};

export const FilledAlternative = {
  args: {
    title: "Filled alternative hero",
    subtitle: "Uses the alternative variant with a filled background.",
    actions: [{ text: "Get started", href: "/start", variant: "site" }],
    variant: "alternative",
    filled: true,
  } satisfies HeroProps,
};

export const FilledSite = {
  args: {
    title: "Filled site hero",
    subtitle: "Uses the site variant with a filled background.",
    actions: [{ text: "Get started", href: "/start" }],
    variant: "site",
    filled: true,
  } satisfies HeroProps,
};

export const Muted = {
  args: {
    title: "Muted hero",
    subtitle: "A quieter background for a secondary, less prominent hero.",
    actions: [{ text: "Get started", href: "/start" }],
    muted: true,
  } satisfies HeroProps,
};
