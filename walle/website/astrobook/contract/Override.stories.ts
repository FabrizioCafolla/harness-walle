import OverrideDemo from "./OverrideDemo.astro";
import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: OverrideDemo,
  decorators: [{ component: StoryWrapper }],
};

export const Default = {
  args: {},
};
