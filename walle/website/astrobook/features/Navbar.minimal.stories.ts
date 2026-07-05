import type { ComponentProps } from "astro/types";

import NavbarMinimal from "@walle/components/features/Navbar/Navbar.minimal.astro";

type NavbarMinimalProps = ComponentProps<typeof NavbarMinimal>;

// `minimal` variant from the AVAILABLE_VARIANTS registry (navbar -> minimal).
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
  component: NavbarMinimal,
  decorators: [{ component: StoryWrapper }],
};

export const Minimal = {
  args: { config } satisfies NavbarMinimalProps,
};
