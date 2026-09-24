import type { ComponentProps } from "astro/types";

import Badge from "@walle/components/elements/Badge.astro";
import StoryWrapper from "../StoryWrapper.astro";

type BadgeProps = ComponentProps<typeof Badge>;

export default {
  component: Badge,
  decorators: [{ component: StoryWrapper }],
};

export const Primary = {
  args: { text: "Primary", variant: "primary" } satisfies BadgeProps,
};

export const Secondary = {
  args: { text: "Secondary", variant: "secondary" } satisfies BadgeProps,
};

export const Alternative = {
  args: { text: "Alternative", variant: "alternative" } satisfies BadgeProps,
};

export const Site = {
  args: { text: "Site", variant: "site" } satisfies BadgeProps,
};

export const Muted = {
  args: { text: "Muted", muted: true } satisfies BadgeProps,
};

export const Outline = {
  args: { text: "Outline", variant: "primary", outline: true } satisfies BadgeProps,
};

export const Success = {
  args: { text: "Success", status: "success" } satisfies BadgeProps,
};

export const Warning = {
  args: { text: "Warning", status: "warning" } satisfies BadgeProps,
};

export const Danger = {
  args: { text: "Danger", status: "danger" } satisfies BadgeProps,
};

export const Small = {
  args: { text: "Small", size: "small" } satisfies BadgeProps,
};

export const Large = {
  args: { text: "Large", size: "large" } satisfies BadgeProps,
};

export const WithIcon = {
  args: { text: "Starred", icon: "mdi:star", iconPosition: "start" } satisfies BadgeProps,
};

export const AsLink = {
  args: {
    text: "External",
    variant: "primary",
    href: "https://example.com",
    target: "_blank",
  } satisfies BadgeProps,
};
