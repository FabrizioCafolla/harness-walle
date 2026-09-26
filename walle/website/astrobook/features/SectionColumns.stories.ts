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

export const FilledPrimary = {
  args: {
    title: "Filled primary",
    columns: 3,
    items: 3,
    variant: "primary",
    filled: true,
  } satisfies SectionColumnsDemoProps,
};

export const FilledSecondary = {
  args: {
    title: "Filled secondary",
    columns: 3,
    items: 3,
    variant: "secondary",
    filled: true,
  } satisfies SectionColumnsDemoProps,
};

export const FilledAlternative = {
  args: {
    title: "Filled alternative",
    columns: 3,
    items: 3,
    variant: "alternative",
    filled: true,
  } satisfies SectionColumnsDemoProps,
};

export const FilledSite = {
  args: {
    title: "Filled site",
    columns: 3,
    items: 3,
    variant: "site",
    filled: true,
  } satisfies SectionColumnsDemoProps,
};
