import { describe, expect, it } from "vitest";
import {
  calculateReadingTime,
  calculateTimeAgo,
  formatDate,
  getPlatformIcon,
  normalizePath,
  resolveInternalUrl,
  truncateAtWord,
} from "../../src/@walle/utils/helpers";

describe("getPlatformIcon", () => {
  it("matches known platforms case-insensitively", () => {
    expect(getPlatformIcon("https://GITHUB.com/x")).toBe("fa:github");
    expect(getPlatformIcon("gitlab.com/x")).toBe("fa:gitlab");
    expect(getPlatformIcon("bitbucket.org/x")).toBe("fa:bitbucket");
  });

  it("falls back to a generic icon for unknown platforms", () => {
    expect(getPlatformIcon("https://example.com")).toBe("fa:code-fork");
  });
});

describe("calculateTimeAgo", () => {
  it("returns null for an empty date", () => {
    expect(calculateTimeAgo("")).toBeNull();
  });

  it("buckets recent dates into Today/Yesterday/days/months/years", () => {
    const now = Date.now();
    const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();
    expect(calculateTimeAgo(daysAgo(0))).toBe("Today");
    expect(calculateTimeAgo(daysAgo(1))).toBe("Yesterday");
    expect(calculateTimeAgo(daysAgo(10))).toBe("10 days ago");
    expect(calculateTimeAgo(daysAgo(60))).toBe("2 months ago");
    expect(calculateTimeAgo(daysAgo(400))).toBe("1 years ago");
  });
});

describe("formatDate", () => {
  it("returns null for an empty date", () => {
    expect(formatDate("")).toBeNull();
  });

  it("formats as 'D Mon YYYY'", () => {
    expect(formatDate("2026-03-05T00:00:00.000Z")).toBe("5 Mar 2026");
  });
});

describe("calculateReadingTime", () => {
  it("counts words and rounds up minutes", () => {
    const words = new Array(200).fill("word").join(" ");
    const result = calculateReadingTime(words);
    expect(result.words).toBe(200);
    expect(result.minutes).toBe(1);
    expect(result.text).toBe("1 minute read");
  });

  it("strips markdown/HTML and accounts for images and code blocks", () => {
    const content = "<p>hello</p> ![alt](img.png) ```\ncode\n``` [link](url)";
    const result = calculateReadingTime(content);
    // "hello" + "link" survive stripping; images/code blocks add fixed seconds, not words.
    expect(result.words).toBe(2);
    expect(result.minutes).toBeGreaterThan(0);
  });

  it("uses plural 'minutes' when the rounded time is not 1", () => {
    const words = new Array(500).fill("word").join(" ");
    const result = calculateReadingTime(words);
    expect(result.minutes).toBeGreaterThan(1);
    expect(result.text).toMatch(/minutes read$/);
  });
});

describe("resolveInternalUrl", () => {
  it("leaves external, anchor, mailto, and tel links untouched", () => {
    expect(resolveInternalUrl("https://example.com")).toBe("https://example.com");
    expect(resolveInternalUrl("//example.com")).toBe("//example.com");
    expect(resolveInternalUrl("#section")).toBe("#section");
    expect(resolveInternalUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(resolveInternalUrl("tel:+123")).toBe("tel:+123");
  });

  it("passes through empty and relative (non-leading-slash) URLs unchanged", () => {
    expect(resolveInternalUrl("")).toBe("");
    expect(resolveInternalUrl("relative/path")).toBe("relative/path");
  });

  it("prefixes root-relative URLs with the base path", () => {
    // No BASE_URL configured in the test environment → base path resolves to "".
    expect(resolveInternalUrl("/blog")).toBe("/blog");
    expect(resolveInternalUrl("/")).toBe("/");
  });
});

describe("normalizePath", () => {
  it("returns '/' for empty input or the root itself", () => {
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("/")).toBe("/");
  });

  it("strips a single trailing slash", () => {
    expect(normalizePath("/blog/")).toBe("/blog");
    expect(normalizePath("/blog")).toBe("/blog");
  });
});

describe("truncateAtWord", () => {
  it("leaves text that fits untouched", () => {
    expect(truncateAtWord("Short enough", 155)).toBe("Short enough");
  });

  it("leaves text exactly at the budget untouched", () => {
    expect(truncateAtWord("abcde", 5)).toBe("abcde");
  });

  it("cuts at the last word boundary and appends an ellipsis", () => {
    expect(truncateAtWord("one two three four", 12)).toBe("one two…");
  });

  it("leaves no dangling space before the ellipsis", () => {
    expect(truncateAtWord("one two    three", 12)).toBe("one two…");
  });

  // The regression this function exists for: lastIndexOf(" ", n) returns -1 when the first n
  // characters hold no space, and slice(0, -1) would then drop a single character instead of
  // truncating, returning a string almost as long as the original.
  it("still truncates when no space fits in the budget", () => {
    const out = truncateAtWord("a".repeat(200), 20);
    expect(out).toBe("a".repeat(19) + "…");
    expect(out.length).toBe(20);
  });

  it("truncates when the only space falls past the budget", () => {
    expect(truncateAtWord("a".repeat(50) + " tail", 10)).toBe("a".repeat(9) + "…");
  });
});
