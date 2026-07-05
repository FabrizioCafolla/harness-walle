import type { ComponentProps } from "astro/types";

import BlogArticleNavigation from "@walle/components/features/Blog/BlogArticleNavigation.astro";

type BlogArticleNavigationProps = ComponentProps<typeof BlogArticleNavigation>;

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: BlogArticleNavigation,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: {
    navigation: {
      columnName: "articles",
      previousArticle: { title: "Getting started with Walle", slug: "/blog/getting-started" },
      nextArticle: { title: "Customizing the theme", slug: "/blog/customizing-the-theme" },
    },
  } satisfies BlogArticleNavigationProps,
};
