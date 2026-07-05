import type { ComponentProps } from "astro/types";

import BlogTableOfContents from "@walle/components/features/Blog/BlogTableOfContents.astro";

type BlogTableOfContentsProps = ComponentProps<typeof BlogTableOfContents>;

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: BlogTableOfContents,
  decorators: [{ component: StoryWrapper }],
};

// TableOfContentsManager scans the page for headings; with none present on this isolated
// story page it renders the empty shell (header + nav frame) — covers structural/CSS regressions.
export const Default = {
  args: {} satisfies BlogTableOfContentsProps,
};
