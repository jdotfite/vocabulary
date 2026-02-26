/**
 * Elo-like ability tracking and SRS scheduling for adaptive learning.
 */

// ---------------------------------------------------------------------------
// Elo ability update
// ---------------------------------------------------------------------------

export const ELO_K = 4; // sensitivity factor
export const ELO_SCALE = 15; // logistic scale

export function computeEloUpdate(
  userAbility: number,
  wordDifficulty: number,
  isCorrect: boolean
): number {
  const expected =
    1 / (1 + Math.exp((wordDifficulty - userAbility) / ELO_SCALE));
  const actual = isCorrect ? 1 : 0;
  const newAbility = userAbility + ELO_K * (actual - expected);
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
    // Use streak-1 as index (streak=1 after first correct → index 0 → 4h)
    const idx = Math.min(Math.max(0, currentStreak - 1), SRS_INTERVALS.length - 1);
    intervalHours = SRS_INTERVALS[idx] ?? 4;
  }

  const nextReviewAt = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
  return { intervalHours, nextReviewAt };
}
