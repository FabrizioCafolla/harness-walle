import type { ComponentProps } from "astro/types";

import Map from "@walle/components/features/Map/Map.astro";

type MapProps = ComponentProps<typeof Map>;

import StoryWrapper from "../StoryWrapper.astro";

export default {
  component: Map,
  decorators: [{ component: StoryWrapper }],
};

export const SinglePin = {
  args: {
    markers: [{ lat: 41.9028, lng: 12.4964, title: "Rome office", description: "HQ" }],
  } satisfies MapProps,
};

export const SeveralPins = {
  args: {
    markers: [
      { lat: 41.9028, lng: 12.4964, title: "Rome office" },
      { lat: 45.4642, lng: 9.19, title: "Milan office" },
      { lat: 40.8518, lng: 14.2681, title: "Naples office" },
    ],
  } satisfies MapProps,
};

export const SiteVariant = {
  args: {
    markers: [
      { lat: 41.9028, lng: 12.4964, title: "Rome office", variant: "site" },
      { lat: 45.4642, lng: 9.19, title: "Milan office" },
    ],
  } satisfies MapProps,
};

export const AllVariants = {
  args: {
    markers: [
      { lat: 41.9028, lng: 12.4964, title: "Rome office", variant: "primary" },
      { lat: 45.4642, lng: 9.19, title: "Milan office", variant: "secondary" },
      { lat: 40.8518, lng: 14.2681, title: "Naples office", variant: "alternative" },
      { lat: 44.4949, lng: 11.3426, title: "Bologna office", variant: "site" },
    ],
  } satisfies MapProps,
};
