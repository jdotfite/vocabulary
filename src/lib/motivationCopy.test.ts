import { describe, expect, it } from "vitest";

import {
  getChallengeInsight,
  getDailyHomeInsight,
  getSummaryInsight
} from "@/lib/motivationCopy";

describe("motivationCopy", () => {
  const sampleDate = new Date("2026-02-28T09:00:00");

  it("returns a stable daily home insight for the same day", () => {
    expect(getDailyHomeInsight(undefined, sampleDate)).toBe(
      getDailyHomeInsight(undefined, sampleDate)
    );
  });

  it("returns a stable challenge insight for the same mode and day", () => {
    expect(getChallengeInsight("sprint", sampleDate)).toBe(
      getChallengeInsight("sprint", sampleDate)
    );
  });

  it("returns a stable summary insight for the same score band and day", () => {
    expect(getSummaryInsight(8, 10, sampleDate)).toBe(
      getSummaryInsight(8, 10, sampleDate)
    );
  });

  it("prefers review-focused copy when words are due", () => {
    const insight = getDailyHomeInsight(
      { wordsForReview: 4, streakCount: 5, wordsMastered: 12, accuracy: 90 },
      sampleDate
    );
    expect(insight.toLowerCase()).toMatch(/review|weak|revisit/);
  });
});
