import { describe, expect, it, vi } from "vitest";

// Isolated in its own file: mocking @walle/config's website.language here would otherwise
// leak into every other test in helpers.test.ts via vi.mock's file-scoped hoisting (same
// reasoning as VariantPicker.locale-default.test.ts).
vi.mock("@walle/config", () => ({
  default: { app: { website: { language: "it-IT" } } },
}));

const { calculateReadingTime, formatDate } = await import("../../src/@walle/utils/helpers");

describe("formatDate locale default (no locale arg)", () => {
  it("formats with the configured website.language, not a hardcoded locale", () => {
    expect(formatDate("2026-03-05T00:00:00.000Z")).toBe("5 mar 2026");
  });
});

describe("calculateReadingTime locale default", () => {
  it("pluralizes the duration in the configured locale, not English", () => {
    // 900 words / 200 wpm = 4.5, rounds up to 5 minutes.
    const words = new Array(900).fill("word").join(" ");
    const result = calculateReadingTime(words);
    expect(result.minutes).toBe(5);
    expect(result.text).toBe("5 minuti read");
  });
});
