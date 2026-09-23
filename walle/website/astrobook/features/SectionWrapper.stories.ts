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

export const Filled = {
  args: {
    title: "Filled section",
    subtitle: "Uses the variant background and foreground.",
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
