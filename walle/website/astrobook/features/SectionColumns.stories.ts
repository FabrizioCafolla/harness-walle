import type { ComponentProps } from "astro/types";

import SectionColumnsDemo from "./SectionColumnsDemo.astro";
import StoryWrapper from "../StoryWrapper.astro";

type SectionColumnsDemoProps = ComponentProps<typeof SectionColumnsDemo>;

export default {
  component: SectionColumnsDemo,
  decorators: [{ component: StoryWrapper }],
};

export const TwoColumns = {
  args: { title: "Two columns", columns: 2, items: 2 } satisfies SectionColumnsDemoProps,
};

export const ThreeColumns = {
  args: { title: "Three columns", columns: 3, items: 3 } satisfies SectionColumnsDemoProps,
};

export const FourColumns = {
  args: { title: "Four columns", columns: 4, items: 4 } satisfies SectionColumnsDemoProps,
};

export const MutedCentered = {
  args: {
    title: "Muted centered",
    columns: 3,
    items: 3,
    muted: true,
    centered: true,
  } satisfies SectionColumnsDemoProps,
};
