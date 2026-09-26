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

export const Secondary = {
  args: { href: "/blog", text: "Secondary link", variant: "secondary" } satisfies LinkProps,
};

export const Alternative = {
  args: { href: "/blog", text: "Alternative link", variant: "alternative" } satisfies LinkProps,
};

export const Site = {
  args: { href: "/blog", text: "Site link", variant: "site" } satisfies LinkProps,
};

export const Muted = {
  args: { href: "/blog", text: "Muted link", muted: true } satisfies LinkProps,
};

export const Unstyled = {
  args: { href: "/blog", text: "Unstyled link", unstyled: true } satisfies LinkProps,
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
