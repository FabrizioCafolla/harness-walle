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
    linkUrl: "/blog/example",
  } satisfies BasicCardProps,
};
