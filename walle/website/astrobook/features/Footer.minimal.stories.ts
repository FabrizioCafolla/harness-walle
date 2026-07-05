import FooterMinimal from "@walle/components/features/Footer.minimal.astro";

import StoryWrapper from "../StoryWrapper.astro";

// `minimal` variant (footer -> minimal). Renders from the resolved global
// @walle/config (no props); the story shows the minimal layout.
export default {
  component: FooterMinimal,
  decorators: [{ component: StoryWrapper }],
};

export const Minimal = {
  args: {},
};
