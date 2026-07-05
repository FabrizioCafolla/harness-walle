import type { ComponentProps } from "astro/types";

import Navbar from "@walle/components/features/Navbar/Navbar.astro";

type NavbarProps = ComponentProps<typeof Navbar>;

// `standard` variant from the AVAILABLE_VARIANTS registry (navbar -> standard).
const config = {
  logo: { title: "Walle", url: "/" },
  items: [
    { name: "Home", url: "/" },
    { name: "Docs", url: "/docs" },
    { name: "Blog", url: "/blog" },
  ],
};

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: Navbar,
  decorators: [{ component: StoryWrapper }],
};

export const Standard = {
  args: { config } satisfies NavbarProps,
};
