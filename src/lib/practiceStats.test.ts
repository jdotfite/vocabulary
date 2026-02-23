import { describe, expect, it } from "vitest";

import { formatPracticeDate } from "@/lib/practiceStats";

describe("practiceStats", () => {
  it("formats a valid ISO date to en-GB format", () => {
    const result = formatPracticeDate("2026-02-20T12:00:00.000Z");
    expect(result).toBe("20/02/2026");
  });

  it("returns empty string for invalid date", () => {
    expect(formatPracticeDate("invalid")).toBe("");
  });
});
