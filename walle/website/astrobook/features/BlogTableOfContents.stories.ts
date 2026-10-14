import type { ComponentProps } from "astro/types";

import BlogTableOfContents from "@walle/components/features/Blog/BlogTableOfContents.astro";

type BlogTableOfContentsProps = ComponentProps<typeof BlogTableOfContents>;

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: BlogTableOfContents,
  decorators: [{ component: StoryWrapper }],
};

// No headings on the story page: TableOfContentsManager renders the empty shell.
export const Default = {
  args: {} satisfies BlogTableOfContentsProps,
};
