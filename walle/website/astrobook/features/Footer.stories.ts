import Footer from "@walle/components/features/Footer.astro";

import StoryWrapper from "../StoryWrapper.astro";

// Footer takes no props: it renders from the resolved @walle/config.
export default {
  component: Footer,
  decorators: [{ component: StoryWrapper }],
};

export const Standard = {
  args: {},
};
