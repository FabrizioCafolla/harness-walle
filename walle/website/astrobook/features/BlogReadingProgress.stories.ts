import type { ComponentProps } from "astro/types";

import BlogReadingProgress from "@walle/components/features/Blog/BlogReadingProgress.astro";

type BlogReadingProgressProps = ComponentProps<typeof BlogReadingProgress>;

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: BlogReadingProgress,
  decorators: [{ component: StoryWrapper }],
};

// The bar's script no-ops when its target selector isn't found (no article on this page),
// so it renders at its resting 0% width — this story covers structural/CSS regressions.
export const Default = {
  args: {} satisfies BlogReadingProgressProps,
};
