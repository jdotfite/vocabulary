import { beforeEach, describe, expect, it } from "vitest";

import { getPracticeStatsSnapshot, recordPracticeSession } from "@/lib/practiceStats";
import type { CompletedQuizPayload } from "@/types/session";

function buildPayload(input: Partial<CompletedQuizPayload>): CompletedQuizPayload {
  return {
    modeId: "kids_easy",
    score: 0,
    total: 10,
    answers: [],
    completedAt: "2026-02-20T12:00:00.000Z",
    ...input
  };
}

describe("practiceStats", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns empty defaults when no sessions are stored", () => {
    const stats = getPracticeStatsSnapshot();

    expect(stats.lastPractice).toBeNull();
    expect(stats.wordsRead).toBe(0);
    expect(stats.practices).toBe(0);
    expect(stats.favorited).toBe(0);
    expect(stats.saved).toBe(0);
    expect(stats.streakCount).toBe(0);
    expect(stats.weekActivity).toHaveLength(7);
  });

  it("tracks latest practice and aggregate counts", () => {
    recordPracticeSession(
      buildPayload({
        score: 4,
        total: 10,
        completedAt: "2026-02-20T12:00:00.000Z"
      })
    );
    recordPracticeSession(
      buildPayload({
        modeId: "adult_intermediate",
        score: 8,
        total: 10,
        completedAt: "2026-02-21T12:00:00.000Z"
      })
    );

    const stats = getPracticeStatsSnapshot();

    expect(stats.lastPractice?.score).toBe(8);
    expect(stats.lastPractice?.modeId).toBe("adult_intermediate");
    expect(stats.wordsRead).toBe(20);
    expect(stats.practices).toBe(2);
  });

  it("computes streaks from consecutive practice days", () => {
    recordPracticeSession(
      buildPayload({
        completedAt: "2026-02-22T12:00:00.000Z"
      })
    );
    recordPracticeSession(
      buildPayload({
        completedAt: "2026-02-23T12:00:00.000Z"
      })
    );
    recordPracticeSession(
      buildPayload({
        completedAt: "2026-02-24T12:00:00.000Z"
      })
    );

    const stats = getPracticeStatsSnapshot();
    const activeDays = stats.weekActivity.filter((day) => day.isActive);

    expect(stats.streakCount).toBe(3);
    expect(activeDays).toHaveLength(3);
  });
});
