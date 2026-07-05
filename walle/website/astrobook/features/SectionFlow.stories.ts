import type { ComponentProps } from "astro/types";

import SectionFlow from "@walle/components/features/Sections/SectionFlow.astro";
import StoryWrapper from "../StoryWrapper.astro";

type SectionFlowProps = ComponentProps<typeof SectionFlow>;

export default {
  component: SectionFlow,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: {
    title: "How it works",
    steps: [
      { number: 1, title: "Install", description: "Run the CLI to scaffold the project." },
      { number: 2, title: "Configure", description: "Edit config files to match your brand." },
      { number: 3, title: "Deploy", description: "Push to your host — static or SSR." },
    ],
  } satisfies SectionFlowProps,
};
