import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import CollectionFilters from "../../../src/@walle/components/features/CollectionFilters.astro";

describe("CollectionFilters", () => {
  it("renders one .filters__facet per facet passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CollectionFilters, {
      props: {
        facets: [
          { key: "category", label: "Category", options: ["A", "B"] },
          { key: "size", label: "Size", options: ["S", "M"] },
        ],
      },
    });
    expect(html.match(/filters__facet/g)?.length).toBe(2);
  });

  it("renders the search input when search is true", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CollectionFilters, {
      props: { search: true },
    });
    expect(html).toContain("filters__input");
  });

  it("omits the search input when search is false", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CollectionFilters, {
      props: { search: false },
    });
    expect(html).not.toContain("filters__input");
  });

  it("passes through arbitrary attributes via {...rest}", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CollectionFilters, {
      props: { "data-testid": "my-filters" },
    });
    expect(html).toContain('data-testid="my-filters"');
  });
});
