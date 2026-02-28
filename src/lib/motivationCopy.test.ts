import { describe, expect, it } from "vitest";

import {
  getChallengeInsight,
  getDailyHomeInsight,
  getSummaryInsight
} from "@/lib/motivationCopy";

describe("motivationCopy", () => {
  const sampleDate = new Date("2026-02-28T09:00:00");

  it("returns a stable daily home insight for the same day", () => {
    expect(getDailyHomeInsight(sampleDate)).toBe(getDailyHomeInsight(sampleDate));
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
});
