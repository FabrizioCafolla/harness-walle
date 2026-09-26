import type { ComponentProps } from "astro/types";

import SectionFlow from "@walle/components/features/Sections/SectionFlow.astro";
import StoryWrapper from "../StoryWrapper.astro";

type SectionFlowProps = ComponentProps<typeof SectionFlow>;

export default {
  component: SectionFlow,
  decorators: [{ component: StoryWrapper }],
};

const steps = [
  { number: 1, title: "Install", description: "Run the CLI to scaffold the project." },
  { number: 2, title: "Configure", description: "Edit config files to match your brand." },
  { number: 3, title: "Deploy", description: "Push to your host: static or SSR." },
];

export const Default = {
  args: { title: "How it works", steps } satisfies SectionFlowProps,
};

export const FilledPrimary = {
  args: {
    title: "How it works",
    steps,
    variant: "primary",
    filled: true,
  } satisfies SectionFlowProps,
};

export const FilledSecondary = {
  args: {
    title: "How it works",
    steps,
    variant: "secondary",
    filled: true,
  } satisfies SectionFlowProps,
};

export const FilledAlternative = {
  args: {
    title: "How it works",
    steps,
    variant: "alternative",
    filled: true,
  } satisfies SectionFlowProps,
};

export const FilledSite = {
  args: { title: "How it works", steps, variant: "site", filled: true } satisfies SectionFlowProps,
};

export const Muted = {
  args: { title: "How it works", steps, muted: true } satisfies SectionFlowProps,
};
