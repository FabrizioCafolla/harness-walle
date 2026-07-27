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

export const Gray = {
  args: { text: "Gray", variant: "gray" } satisfies BadgeProps,
};

export const Success = {
  args: { text: "Success", variant: "success" } satisfies BadgeProps,
};

export const Warning = {
  args: { text: "Warning", variant: "warning" } satisfies BadgeProps,
};

export const Danger = {
  args: { text: "Danger", variant: "danger" } satisfies BadgeProps,
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
