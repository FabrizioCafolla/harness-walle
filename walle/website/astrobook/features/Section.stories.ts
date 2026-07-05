import type { ComponentProps } from "astro/types";

import Section from "@walle/components/features/Sections/Section.astro";

type SectionProps = ComponentProps<typeof Section>;

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: Section,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: { title: "Section title" } satisfies SectionProps,
};
