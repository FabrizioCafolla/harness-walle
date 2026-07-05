import type { ComponentProps } from "astro/types";

import Badge from "@walle/components/elements/Badge.astro";
import StoryWrapper from "../StoryWrapper.astro";

type BadgeProps = ComponentProps<typeof Badge>;

export default {
  component: Badge,
  decorators: [{ component: StoryWrapper }],
};

export const Primary = {
  args: { text: "Primary", color: "primary" } satisfies BadgeProps,
};

export const Success = {
  args: { text: "Success", color: "success" } satisfies BadgeProps,
};

export const Danger = {
  args: { text: "Danger", color: "danger" } satisfies BadgeProps,
};
