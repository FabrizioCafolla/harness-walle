import type { ComponentProps } from "astro/types";

import Image from "@walle/components/elements/Image.astro";
import { resolveInternalUrl } from "@walle/utils";
import StoryWrapper from "../StoryWrapper.astro";

type ImageProps = ComponentProps<typeof Image>;

const src = resolveInternalUrl("/img/posts/default.svg");

export default {
  component: Image,
  decorators: [{ component: StoryWrapper }],
};

export const Remote = {
  args: {
    image: { src, alt: "Sample cover image" },
    width: 480,
    height: 320,
  } satisfies ImageProps,
};

export const RemoteWithRatio = {
  args: {
    image: { src, alt: "Square-cropped image" },
    width: 320,
    height: 320,
    ratio: "1",
  } satisfies ImageProps,
};

export const Eager = {
  args: {
    image: { src, alt: "Above-the-fold image" },
    width: 480,
    height: 320,
    loading: "eager",
  } satisfies ImageProps,
};
