import type { ComponentProps } from "astro/types";

import Breadcrumbs from "@walle/components/features/Breadcrumbs.astro";

type BreadcrumbsProps = ComponentProps<typeof Breadcrumbs>;

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: Breadcrumbs,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: {
    items: [
      { label: "Home", url: "/" },
      { label: "Blog", url: "/blog" },
      { label: "Current post" },
    ],
  } satisfies BreadcrumbsProps,
};
