import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Map from "../../../src/@walle/components/features/Map/Map.astro";

describe("Map", () => {
  it("renders the marker list", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Map, {
      props: {
        markers: [{ lat: 41.9, lng: 12.5, title: "Rome office" }],
      },
    });
    expect(html).toContain("map__list");
    expect(html).toContain("Rome office");
  });

  it("puts the root .map class next to a consumer class on the section", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Map, {
      props: { markers: [{ lat: 41.9, lng: 12.5, title: "Rome" }], class: "office-map" },
    });
    expect(html).toMatch(/<section[^>]*class="[^"]*\bmap\b[^"]*\boffice-map\b/);
  });

  it("skips markers with invalid coordinates", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Map, {
      props: {
        markers: [
          { lat: 41.9, lng: 12.5, title: "Valid" },
          { lat: 200, lng: 12.5, title: "Bad latitude" },
          { lat: 41.9, lng: -200, title: "Bad longitude" },
        ],
      },
    });
    expect(html).toContain("Valid");
    expect(html).not.toContain("Bad latitude");
    expect(html).not.toContain("Bad longitude");
  });

  it("renders nothing when there are zero valid markers", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Map, {
      props: {
        markers: [{ lat: 200, lng: 12.5, title: "Bad latitude" }],
      },
    });
    expect(html).not.toContain("<section");
    expect(html).not.toContain("map__list");
    expect(html).not.toContain("map__container");
  });
});
