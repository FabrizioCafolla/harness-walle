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
      { label: "Home", href: "/" },
      { label: "Blog", href: "/blog" },
      { label: "Current post" },
    ],
  } satisfies BreadcrumbsProps,
};

export const WithIcons = {
  args: {
    items: [
      { label: "Home", href: "/", icon: "mdi:home" },
      { label: "Blog", href: "/blog", icon: "mdi:post" },
      { label: "Current post" },
    ],
  } satisfies BreadcrumbsProps,
};
