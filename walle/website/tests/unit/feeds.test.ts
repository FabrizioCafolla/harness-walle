import { describe, expect, it } from "vitest";
import { buildFeedItems, type FeedItemConfig } from "../../src/@walle/feeds/route";

const baseItem: FeedItemConfig = {
  collection: "posts",
  path: "/rss.xml",
  link: "/blog/{id}",
};

describe("buildFeedItems", () => {
  it("maps fields with a custom mapping (example: date -> publishDate, categories -> tags)", () => {
    const item: FeedItemConfig = {
      ...baseItem,
      fields: { date: "publishDate", categories: "tags" },
    };
    const items = buildFeedItems(
      [
        {
          id: "example",
          data: {
            title: "Example",
            description: "An example post",
            publishDate: new Date("2026-01-01"),
            tags: ["news"],
          },
        },
      ],
      item,
      "https://example.com"
    );
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Example");
    expect(items[0].categories).toEqual(["news"]);
    expect(items[0].link).toBe("https://example.com/blog/example");
  });

  it("defaults field mapping to identity when fields is absent", () => {
    const items = buildFeedItems(
      [{ id: "a", data: { title: "A", description: "desc", date: new Date("2026-01-01") } }],
      baseItem,
      "https://example.com"
    );
    expect(items).toHaveLength(1);
    expect(items[0].description).toBe("desc");
  });

  it("excludes drafts when excludeDrafts is set", () => {
    const item: FeedItemConfig = { ...baseItem, excludeDrafts: true };
    const entries = [
      {
        id: "a",
        data: { title: "A", description: "d", date: new Date("2026-01-01"), draft: true },
      },
      { id: "b", data: { title: "B", description: "d", date: new Date("2026-01-02") } },
    ];
    const items = buildFeedItems(entries, item, "https://example.com");
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("B");
  });

  it("keeps drafts when excludeDrafts is not set", () => {
    const entries = [
      {
        id: "a",
        data: { title: "A", description: "d", date: new Date("2026-01-01"), draft: true },
      },
    ];
    const items = buildFeedItems(entries, baseItem, "https://example.com");
    expect(items).toHaveLength(1);
  });

  it("sorts by the mapped date field, descending", () => {
    const entries = [
      { id: "old", data: { title: "Old", description: "d", date: new Date("2026-01-01") } },
      { id: "new", data: { title: "New", description: "d", date: new Date("2026-06-01") } },
      { id: "mid", data: { title: "Mid", description: "d", date: new Date("2026-03-01") } },
    ];
    const items = buildFeedItems(entries, baseItem, "https://example.com");
    expect(items.map((i) => i.title)).toEqual(["New", "Mid", "Old"]);
  });

  it("applies the configured limit after sorting", () => {
    const item: FeedItemConfig = { ...baseItem, limit: 2 };
    const entries = [
      { id: "old", data: { title: "Old", description: "d", date: new Date("2026-01-01") } },
      { id: "new", data: { title: "New", description: "d", date: new Date("2026-06-01") } },
      { id: "mid", data: { title: "Mid", description: "d", date: new Date("2026-03-01") } },
    ];
    const items = buildFeedItems(entries, item, "https://example.com");
    expect(items.map((i) => i.title)).toEqual(["New", "Mid"]);
  });

  it("keeps the 50 newest entries when no limit is configured", () => {
    const entries = Array.from({ length: 60 }, (_, i) => ({
      id: `p${i}`,
      data: { title: `P${i}`, description: "d", date: new Date(2026, 0, 1 + i) },
    }));
    const items = buildFeedItems(entries, baseItem, "https://example.com");
    expect(items).toHaveLength(50);
    expect(items[0].title).toBe("P59");
  });

  it("throws a build error naming the feed path, collection and field on a missing mapped field", () => {
    const item: FeedItemConfig = { ...baseItem, fields: { date: "publishDate" } };
    const entries = [{ id: "example", data: { title: "A", description: "d" } }];
    expect(() => buildFeedItems(entries, item, "https://example.com")).toThrow(
      /Feed "\/rss\.xml" \(collection "posts"\): entry "example" is missing field "publishDate" \(mapped from "date"\)/
    );
  });

  it("does not throw when categories is missing (optional, not required)", () => {
    const entries = [
      { id: "a", data: { title: "A", description: "d", date: new Date("2026-01-01") } },
    ];
    const items = buildFeedItems(entries, baseItem, "https://example.com");
    expect(items[0].categories).toBeUndefined();
  });
});
