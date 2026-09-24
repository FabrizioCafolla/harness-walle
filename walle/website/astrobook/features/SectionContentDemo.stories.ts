import type { ComponentProps } from "astro/types";

import SectionContentDemo from "./SectionContentDemo.astro";
import StoryWrapper from "../StoryWrapper.astro";

type SectionContentDemoProps = ComponentProps<typeof SectionContentDemo>;

export default {
  component: SectionContentDemo,
  decorators: [{ component: StoryWrapper }],
};

// Plain `<p>`/`<a>`/`<code>` content in a filled section's default slot, per variant.
export const FilledPrimary = {
  args: {
    title: "Filled primary",
    variant: "primary",
    filled: true,
  } satisfies SectionContentDemoProps,
};

export const FilledSecondary = {
  args: {
    title: "Filled secondary",
    variant: "secondary",
    filled: true,
  } satisfies SectionContentDemoProps,
};

export const FilledAlternative = {
  args: {
    title: "Filled alternative",
    variant: "alternative",
    filled: true,
  } satisfies SectionContentDemoProps,
};

export const Muted = {
  args: {
    title: "Muted",
    muted: true,
  } satisfies SectionContentDemoProps,
};
