import type { ComponentProps } from "astro/types";

import Link from "@walle/components/elements/Link.astro";
import StoryWrapper from "../StoryWrapper.astro";

type LinkProps = ComponentProps<typeof Link>;

export default {
  component: Link,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: { href: "/blog", text: "Internal link" } satisfies LinkProps,
};

export const Muted = {
  args: { href: "/blog", text: "Muted link", variant: "muted" } satisfies LinkProps,
};

export const Unstyled = {
  args: { href: "/blog", text: "Unstyled link", variant: "unstyled" } satisfies LinkProps,
};

export const External = {
  args: { href: "https://example.com", text: "External link" } satisfies LinkProps,
};

export const ExternalNoIcon = {
  args: {
    href: "https://example.com",
    text: "External without icon",
    externalIcon: false,
  } satisfies LinkProps,
};
