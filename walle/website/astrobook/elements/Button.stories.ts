import type { ComponentProps } from "astro/types";

import Button from "@walle/components/elements/Button.astro";
import StoryWrapper from "../StoryWrapper.astro";

type ButtonProps = ComponentProps<typeof Button>;

export default {
  component: Button,
  decorators: [{ component: StoryWrapper }],
};

export const Primary = {
  args: { text: "Primary", type: "primary" } satisfies ButtonProps,
};

export const Secondary = {
  args: { text: "Secondary", type: "secondary" } satisfies ButtonProps,
};

export const Outline = {
  args: { text: "Outline", type: "primary", outline: true } satisfies ButtonProps,
};
