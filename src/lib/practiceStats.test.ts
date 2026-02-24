import { describe, expect, it } from "vitest";

import { formatPracticeDate, isPseudoMode } from "@/lib/practiceStats";

describe("practiceStats", () => {
  it("formats a valid ISO date to en-GB format", () => {
    const result = formatPracticeDate("2026-02-20T12:00:00.000Z");
    expect(result).toBe("20/02/2026");
  });

  it("returns empty string for invalid date", () => {
    expect(formatPracticeDate("invalid")).toBe("");
  });
});

describe("isPseudoMode", () => {
  it.each([
    "shuffle",
    "guess_word",
    "meaning_match",
    "fill_gap",
    "weak_words",
    "sprint",
    "perfection",
    "rush",
    "level_test"
  ])("classifies %s as a pseudo-mode", (modeId) => {
    expect(isPseudoMode(modeId)).toBe(true);
  });

  it.each([
    "kids_beginner",
    "kids_intermediate",
    "kids_advanced",
    "adult_beginner",
    "adult_intermediate",
    "adult_advanced"
  ])("classifies %s as a tier mode (not pseudo)", (modeId) => {
    expect(isPseudoMode(modeId)).toBe(false);
  });
});
