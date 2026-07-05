import Footer from "@walle/components/features/Footer.astro";

import StoryWrapper from "../StoryWrapper.astro";

// `standard` variant (footer -> standard). Footer renders from the resolved
// global @walle/config (no props); the story shows the standard layout.
export default {
  component: Footer,
  decorators: [{ component: StoryWrapper }],
};

export const Standard = {
  args: {},
};
