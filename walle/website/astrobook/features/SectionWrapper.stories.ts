import type { ComponentProps } from "astro/types";

import SectionWrapperDemo from "./SectionWrapperDemo.astro";
import StoryWrapper from "../StoryWrapper.astro";

type SectionWrapperDemoProps = ComponentProps<typeof SectionWrapperDemo>;

export default {
  component: SectionWrapperDemo,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: {
    title: "Section title",
    subtitle: "A short subtitle describing this section.",
  } satisfies SectionWrapperDemoProps,
};

export const FilledPrimary = {
  args: {
    title: "Filled primary section",
    subtitle: "Uses the variant background and foreground.",
    variant: "primary",
    filled: true,
  } satisfies SectionWrapperDemoProps,
};

export const FilledSecondary = {
  args: {
    title: "Filled secondary section",
    subtitle: "Uses the secondary variant background and foreground.",
    variant: "secondary",
    filled: true,
  } satisfies SectionWrapperDemoProps,
};

export const FilledAlternative = {
  args: {
    title: "Filled alternative section",
    subtitle: "Uses the alternative variant background and foreground.",
    variant: "alternative",
    filled: true,
  } satisfies SectionWrapperDemoProps,
};

export const FilledSite = {
  args: {
    title: "Filled site section",
    subtitle: "Uses the site variant background and foreground.",
    variant: "site",
    filled: true,
  } satisfies SectionWrapperDemoProps,
};

export const Muted = {
  args: {
    title: "Muted section",
    subtitle: "Uses a light gray background with normal text color.",
    muted: true,
  } satisfies SectionWrapperDemoProps,
};
