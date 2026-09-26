import type { ComponentProps } from "astro/types";

import blogDemo1 from "@content/posts/blog-demo-1.jpg";
import SectionHeaderStandard from "@walle/components/features/Sections/HeaderStandard.astro";
import StoryWrapper from "../StoryWrapper.astro";

type SectionHeaderStandardProps = ComponentProps<typeof SectionHeaderStandard>;

export default {
  component: SectionHeaderStandard,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: {
    title: "Minimal header",
    subtitle: "Transparent background for content-first pages.",
  } satisfies SectionHeaderStandardProps,
};

export const Primary = {
  args: {
    title: "Build fast, ship clean",
    subtitle: "A copy-based Astro design system for teams who own their stack.",
    variant: "primary",
    filled: true,
  } satisfies SectionHeaderStandardProps,
};

export const Secondary = {
  args: {
    title: "Open and extensible",
    subtitle: "No black-box dependencies. Clone, extend, and keep full control.",
    variant: "secondary",
    filled: true,
  } satisfies SectionHeaderStandardProps,
};

export const Alternative = {
  args: {
    title: "Bring your own brand",
    subtitle: "Alternative variant, mapped through the same wrapper tokens.",
    variant: "alternative",
    filled: true,
  } satisfies SectionHeaderStandardProps,
};

export const Site = {
  args: {
    title: "Defined once, reused everywhere",
    subtitle: "Site variant, identical to primary until a site overrides it.",
    variant: "site",
    filled: true,
  } satisfies SectionHeaderStandardProps,
};

export const Centered = {
  args: {
    title: "Centered header",
    subtitle: "The default: title and subtitle centered in the band.",
    variant: "primary",
    filled: true,
    centered: true,
  } satisfies SectionHeaderStandardProps,
};

export const WithImage = {
  args: {
    title: "Header with an image",
    subtitle: "The image sits to the left of the text by default.",
    image: { src: blogDemo1, alt: "Sample cover image" },
  } satisfies SectionHeaderStandardProps,
};

export const WithImageRight = {
  args: {
    title: "Header with the image on the right",
    subtitle: "imageRight moves the image to the right and the text to the left.",
    image: { src: blogDemo1, alt: "Sample cover image" },
    imageRight: true,
  } satisfies SectionHeaderStandardProps,
};
