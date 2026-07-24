import type { ComponentProps } from "astro/types";

import BasicCard from "@walle/components/features/Card/BasicCard.astro";

type BasicCardProps = ComponentProps<typeof BasicCard>;

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: BasicCard,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: {
    title: "Card title",
    content: "A short description of the card content.",
    href: "/blog/example",
  } satisfies BasicCardProps,
};

export const WithBadgeAndDate = {
  args: {
    title: "Card with badge",
    content: "A card showing a badge and a publish date in the meta row.",
    href: "/blog/example",
    badge: { text: "News", variant: "secondary" },
    publishDate: "2026-07-23",
  } satisfies BasicCardProps,
};

export const WithImage = {
  args: {
    title: "Card with image",
    content:
      "A card with a cover image, truncated description text that runs a bit longer to exercise the 120 character clamp behaviour of the component.",
    href: "/blog/example",
    image: { src: "/img/posts/default.jpg", alt: "Post cover" },
  } satisfies BasicCardProps,
};

export const ExternalLink = {
  args: {
    title: "External card",
    content: "Opens in a new tab with rel noopener applied automatically.",
    href: "https://example.com",
    target: "_blank",
  } satisfies BasicCardProps,
};
