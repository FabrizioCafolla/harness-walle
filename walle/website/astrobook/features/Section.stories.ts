import type { ComponentProps } from "astro/types";

import Section from "@walle/components/features/Sections/Section.astro";
import { resolveInternalUrl } from "@walle/utils";

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
  args: { title: "Primary section", variant: "primary", filled: true } satisfies SectionProps,
};

export const Secondary = {
  args: { title: "Secondary section", variant: "secondary", filled: true } satisfies SectionProps,
};

export const Alternative = {
  args: {
    title: "Alternative section",
    variant: "alternative",
    filled: true,
  } satisfies SectionProps,
};

export const Site = {
  args: { title: "Site section", variant: "site", filled: true } satisfies SectionProps,
};

export const Muted = {
  args: { title: "Muted section", muted: true } satisfies SectionProps,
};

export const Centered = {
  args: { title: "Centered section", centered: true } satisfies SectionProps,
};

export const WithImage = {
  args: {
    title: "Section with an image",
    image: { src: resolveInternalUrl("/img/posts/default.svg"), alt: "Sample cover image" },
  } satisfies SectionProps,
};

export const WithImageReversed = {
  args: {
    title: "Section with a reversed image",
    image: { src: resolveInternalUrl("/img/posts/default.svg"), alt: "Sample cover image" },
    reversed: true,
  } satisfies SectionProps,
};
