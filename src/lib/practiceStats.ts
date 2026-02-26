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
  abilityScore: number;
  wordsForReview: number;
  wordsMastered: number;
}

const PSEUDO_MODES = new Set([
  "shuffle",
  "guess_word",
  "meaning_match",
  "fill_gap",
  "weak_words",
  "sprint",
  "perfection",
  "rush",
  "level_test"
]);

/** Whether a mode ID is a pseudo-mode (not a real difficulty tier). */
export function isPseudoMode(modeId: string): boolean {
  return PSEUDO_MODES.has(modeId);
}

export async function recordPracticeSession(
  session: CompletedQuizPayload
): Promise<void> {
  const isPseudo = isPseudoMode(session.modeId);
  await apiPost("/api/progress/session", {
    ...(isPseudo
      ? { modeType: session.modeId }
      : { modeId: session.modeId }),
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
