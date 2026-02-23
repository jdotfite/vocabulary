import type { ModeId } from "@/types/content";
import type { CompletedQuizPayload } from "@/types/session";

const STORAGE_KEY = "vocabdeck.practice-sessions.v1";
const MAX_STORED_SESSIONS = 250;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

interface StoredPracticeSession {
  modeId: ModeId;
  score: number;
  total: number;
  completedAt: string;
}

interface WeekActivity {
  label: (typeof WEEKDAY_LABELS)[number];
  isActive: boolean;
}

export interface PracticeStatsSnapshot {
  lastPractice: StoredPracticeSession | null;
  streakCount: number;
  weekActivity: WeekActivity[];
  wordsRead: number;
  practices: number;
}

function isStoredPracticeSession(value: unknown): value is StoredPracticeSession {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.modeId === "string" &&
    typeof candidate.score === "number" &&
    typeof candidate.total === "number" &&
    typeof candidate.completedAt === "string"
  );
}

function parseTimestamp(isoString: string): number {
  const timestamp = Date.parse(isoString);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function readStoredSessions(): StoredPracticeSession[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isStoredPracticeSession)
      .sort((a, b) => parseTimestamp(b.completedAt) - parseTimestamp(a.completedAt));
  } catch {
    return [];
  }
}

function writeStoredSessions(sessions: StoredPracticeSession[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore storage write errors (e.g., private mode/quota).
  }
}

function buildDaySet(sessions: StoredPracticeSession[]): Set<string> {
  const keys = sessions
    .map((session) => {
      const completed = new Date(session.completedAt);
      return Number.isNaN(completed.getTime()) ? null : toDateKey(completed);
    })
    .filter((key): key is string => key !== null);

  return new Set(keys);
}

function getCurrentStreak(daySet: Set<string>): number {
  if (daySet.size === 0) return 0;

  const timestamps = Array.from(daySet).map((key) => parseTimestamp(`${key}T00:00:00`));
  const latestTimestamp = Math.max(...timestamps);

  if (!Number.isFinite(latestTimestamp)) return 0;

  let streak = 0;
  let cursor = new Date(latestTimestamp);

  while (daySet.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function getWeekActivity(daySet: Set<string>, anchorDate: Date): WeekActivity[] {
  const weekStart = addDays(anchorDate, -anchorDate.getDay());

  return WEEKDAY_LABELS.map((label, index) => {
    const current = addDays(weekStart, index);
    return {
      label,
      isActive: daySet.has(toDateKey(current))
    };
  });
}

export function recordPracticeSession(session: CompletedQuizPayload): void {
  const existing = readStoredSessions();
  const next: StoredPracticeSession = {
    modeId: session.modeId,
    score: session.score,
    total: session.total,
    completedAt: session.completedAt
  };

  const updated = [next, ...existing]
    .sort((a, b) => parseTimestamp(b.completedAt) - parseTimestamp(a.completedAt))
    .slice(0, MAX_STORED_SESSIONS);

  writeStoredSessions(updated);
}

export function getPracticeStatsSnapshot(): PracticeStatsSnapshot {
  const sessions = readStoredSessions();
  const daySet = buildDaySet(sessions);
  const maybeAnchor = sessions[0] ? new Date(sessions[0].completedAt) : new Date();
  const anchorDate = Number.isNaN(maybeAnchor.getTime()) ? new Date() : maybeAnchor;

  return {
    lastPractice: sessions[0] ?? null,
    streakCount: getCurrentStreak(daySet),
    weekActivity: getWeekActivity(daySet, anchorDate),
    wordsRead: sessions.reduce((total, session) => total + session.total, 0),
    practices: sessions.length
  };
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
