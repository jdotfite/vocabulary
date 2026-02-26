/**
 * Elo-like ability tracking and SRS scheduling for adaptive learning.
 */

// ---------------------------------------------------------------------------
// Elo ability update
// ---------------------------------------------------------------------------

const K = 4; // sensitivity factor
const SCALE = 15; // logistic scale

export function computeEloUpdate(
  userAbility: number,
  wordDifficulty: number,
  isCorrect: boolean
): number {
  const expected =
    1 / (1 + Math.exp((wordDifficulty - userAbility) / SCALE));
  const actual = isCorrect ? 1 : 0;
  const newAbility = userAbility + K * (actual - expected);
  return clamp(0, 100, newAbility);
}

function clamp(min: number, max: number, val: number): number {
  return Math.max(min, Math.min(max, val));
}

// ---------------------------------------------------------------------------
// SRS intervals (in hours)
// ---------------------------------------------------------------------------

const SRS_INTERVALS = [4, 8, 24, 72, 168, 504, 1440]; // 4h, 8h, 1d, 3d, 7d, 21d, 60d

export function computeSrsInterval(
  currentStreak: number,
  isCorrect: boolean
): { intervalHours: number; nextReviewAt: Date } {
  let intervalHours: number;

  if (!isCorrect) {
    // Reset to shortest interval on incorrect
    intervalHours = SRS_INTERVALS[0] ?? 4;
  } else {
    // Use streak to index into intervals (capped at max)
    const idx = Math.min(currentStreak, SRS_INTERVALS.length - 1);
    intervalHours = SRS_INTERVALS[idx] ?? 4;
  }

  const nextReviewAt = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
  return { intervalHours, nextReviewAt };
}
