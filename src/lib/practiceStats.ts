import { apiGet, apiPost } from "@/lib/api";
import type { CompletedQuizPayload } from "@/types/session";

interface WeekActivity {
  label: string;
  isActive: boolean;
}

export interface PracticeStatsSnapshot {
  lastPractice: {
    modeId: string;
    score: number;
    total: number;
    completedAt: string;
  } | null;
  streakCount: number;
  weekActivity: WeekActivity[];
  wordsRead: number;
  practices: number;
  favoritedCount: number;
  bookmarkedCount: number;
}

export async function recordPracticeSession(
  session: CompletedQuizPayload
): Promise<void> {
  await apiPost("/api/progress/session", {
    modeId: session.modeId,
    score: session.score,
    total: session.total,
    answers: session.answers,
    completedAt: session.completedAt
  });
}

export async function getPracticeStatsSnapshot(): Promise<PracticeStatsSnapshot> {
  return apiGet<PracticeStatsSnapshot>("/api/progress/stats");
}

export function formatPracticeDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}
