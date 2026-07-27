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

export const Primary = {
  args: { title: "Primary section", variant: "primary" } satisfies SectionProps,
};

export const Gray = {
  args: { title: "Gray section", variant: "gray" } satisfies SectionProps,
};

export const Centered = {
  args: { title: "Centered section", centered: true } satisfies SectionProps,
};
