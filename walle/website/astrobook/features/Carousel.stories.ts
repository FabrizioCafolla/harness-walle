import type { ComponentProps } from "astro/types";

import CarouselDemo from "./CarouselDemo.astro";
import StoryWrapper from "../StoryWrapper.astro";

type CarouselDemoProps = ComponentProps<typeof CarouselDemo>;

export default {
  component: CarouselDemo,
  decorators: [{ component: StoryWrapper }],
};

export const SingleSlide = {
  args: { label: "One per view", perView: 1 } satisfies CarouselDemoProps,
};

export const ThreePerView = {
  args: { label: "Three per view", perView: 3, slides: 7 } satisfies CarouselDemoProps,
};

export const NoControls = {
  args: { label: "Swipe only", controls: false } satisfies CarouselDemoProps,
};
