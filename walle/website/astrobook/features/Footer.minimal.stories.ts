import FooterMinimal from "@walle/components/features/Footer.minimal.astro";

import StoryWrapper from "../StoryWrapper.astro";

// FooterMinimal takes no props: it renders from the resolved @walle/config.
export default {
  component: FooterMinimal,
  decorators: [{ component: StoryWrapper }],
};

export const Minimal = {
  args: {},
};
