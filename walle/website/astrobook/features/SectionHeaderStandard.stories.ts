import type { ComponentProps } from "astro/types";

import SectionHeaderStandard from "@walle/components/features/Sections/HeaderStandard.astro";
import StoryWrapper from "../StoryWrapper.astro";

type SectionHeaderStandardProps = ComponentProps<typeof SectionHeaderStandard>;

export default {
  component: SectionHeaderStandard,
  decorators: [{ component: StoryWrapper }],
};

export const Primary = {
  args: {
    title: "Build fast, ship clean",
    subtitle: "A copy-based Astro design system for teams who own their stack.",
    variant: "primary",
  } satisfies SectionHeaderStandardProps,
};

export const Secondary = {
  args: {
    title: "Open and extensible",
    subtitle: "No black-box dependencies. Clone, extend, and keep full control.",
    variant: "secondary",
  } satisfies SectionHeaderStandardProps,
};

export const White = {
  args: {
    title: "Minimal header",
    subtitle: "Transparent background for content-first pages.",
    variant: "white",
  } satisfies SectionHeaderStandardProps,
};

export const WithEffect = {
  args: {
    title: "Animated gradient",
    subtitle: "Header with the gradient background effect enabled.",
    variant: "primary",
    effect: true,
  } satisfies SectionHeaderStandardProps,
};
