import type { ComponentProps } from "astro/types";

import BlogReadingProgress from "@walle/components/features/Blog/BlogReadingProgress.astro";

type BlogReadingProgressProps = ComponentProps<typeof BlogReadingProgress>;

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: BlogReadingProgress,
  decorators: [{ component: StoryWrapper }],
};

// No article on the story page: the bar's script no-ops and renders at 0% width.
export const Default = {
  args: {} satisfies BlogReadingProgressProps,
};
