import type { ComponentProps } from "astro/types";

import CollectionFiltersDemo from "./CollectionFiltersDemo.astro";
import StoryWrapper from "../StoryWrapper.astro";

type CollectionFiltersDemoProps = ComponentProps<typeof CollectionFiltersDemo>;

export default {
  component: CollectionFiltersDemo,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: {} satisfies CollectionFiltersDemoProps,
};

export const WithoutSearch = {
  args: { withSearch: false } satisfies CollectionFiltersDemoProps,
};
