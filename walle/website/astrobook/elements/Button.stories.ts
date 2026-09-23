import type { ComponentProps } from "astro/types";

import Button from "@walle/components/elements/Button.astro";
import StoryWrapper from "../StoryWrapper.astro";

type ButtonProps = ComponentProps<typeof Button>;

export default {
  component: Button,
  decorators: [{ component: StoryWrapper }],
};

export const Primary = {
  args: { text: "Primary", variant: "primary" } satisfies ButtonProps,
};

export const Secondary = {
  args: { text: "Secondary", variant: "secondary" } satisfies ButtonProps,
};

export const Inverse = {
  args: { text: "Inverse", inverse: true } satisfies ButtonProps,
};

export const Outline = {
  args: { text: "Outline", variant: "primary", outline: true } satisfies ButtonProps,
};

export const InverseOutline = {
  args: { text: "Inverse outline", inverse: true, outline: true } satisfies ButtonProps,
};

export const Small = {
  args: { text: "Small", size: "small" } satisfies ButtonProps,
};

export const Large = {
  args: { text: "Large", size: "large" } satisfies ButtonProps,
};

export const WithIcon = {
  args: { text: "Star", icon: "mdi:star" } satisfies ButtonProps,
};

export const AsLink = {
  args: {
    text: "External link",
    href: "https://example.com",
    target: "_blank",
  } satisfies ButtonProps,
};

export const Disabled = {
  args: { text: "Disabled", disabled: true } satisfies ButtonProps,
};
