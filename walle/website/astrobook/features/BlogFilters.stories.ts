import type { ComponentProps } from "astro/types";

import BlogFilters from "@walle/components/features/Blog/BlogFilters.astro";

type BlogFiltersProps = ComponentProps<typeof BlogFilters>;

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: BlogFilters,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: {
    categories: ["Engineering", "Platform", "AI"],
  } satisfies BlogFiltersProps,
};
