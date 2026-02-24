import { getQuestionsByTiers } from "@/lib/modes";
import { getRecentlySeenWords } from "@/lib/userProgressStore";
import type { ModeId, ModeQuestion, QuestionType } from "@/types/content";

interface UserPrefs {
  vocabularyLevel: string | null;
  ageRange: string | null;
}

interface WordStat {
  timesSeen: number;
  timesCorrect: number;
  timesIncorrect: number;
}

type WordStats = Record<string, WordStat>;

const ALL_TIERS: ModeId[] = [
  "kids_beginner",
  "kids_intermediate",
  "kids_advanced",
  "adult_beginner",
  "adult_intermediate",
  "adult_advanced"
];
const KIDS_TIERS: ModeId[] = ["kids_beginner", "kids_intermediate", "kids_advanced"];
const ADULT_TIERS: ModeId[] = ["adult_beginner", "adult_intermediate", "adult_advanced"];

const MIN_ANSWERS_FOR_ADAPT = 10;

function isKids(ageRange: string | null): boolean {
  return ageRange === "13-17";
}

/** Get base 2 tiers from vocabulary level + age range. */
function getBaseTiers(prefs: UserPrefs): ModeId[] {
  const kids = isKids(prefs.ageRange);

  switch (prefs.vocabularyLevel) {
    case "beginner":
      return kids
        ? ["kids_beginner", "kids_intermediate"]
        : ["kids_advanced", "adult_beginner"];
    case "intermediate":
      return kids
        ? ["kids_intermediate", "kids_advanced"]
        : ["adult_beginner", "adult_intermediate"];
    case "advanced":
      return kids
        ? ["kids_advanced", "adult_beginner"]
        : ["adult_intermediate", "adult_advanced"];
    default:
      return kids ? KIDS_TIERS : ADULT_TIERS;
  }
}

/** Expand tiers based on overall win rate to keep ~70% success. */
function adaptTiers(baseTiers: ModeId[], wordStats: WordStats): ModeId[] {
  let totalSeen = 0;
  let totalCorrect = 0;

  for (const stat of Object.values(wordStats)) {
    totalSeen += stat.timesSeen;
    totalCorrect += stat.timesCorrect;
  }

  if (totalSeen < MIN_ANSWERS_FOR_ADAPT) return baseTiers;

  const winRate = totalCorrect / totalSeen;
  const tiers = new Set(baseTiers);

  if (winRate > 0.8) {
    // Too easy — add next harder tier
    const maxIndex = Math.max(...baseTiers.map((t) => ALL_TIERS.indexOf(t)));
    const harder = ALL_TIERS[maxIndex + 1];
    if (harder) tiers.add(harder);
  } else if (winRate < 0.5) {
    // Too hard — add next easier tier
    const minIndex = Math.min(...baseTiers.map((t) => ALL_TIERS.indexOf(t)));
    const easier = ALL_TIERS[minIndex - 1];
    if (easier) tiers.add(easier);
  }

  return [...tiers];
}

/** Map vocabulary level + age range to tiers, with adaptive expansion. */
export function getTiersForUser(prefs: UserPrefs, wordStats?: WordStats): ModeId[] {
  const base = getBaseTiers(prefs);
  if (!wordStats) return base;
  return adaptTiers(base, wordStats);
}

function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = shuffled[i];
    const b = shuffled[j];
    if (a !== undefined && b !== undefined) {
      shuffled[i] = b;
      shuffled[j] = a;
    }
  }
  return shuffled;
}

function deprioritizeRecent(questions: ModeQuestion[]): ModeQuestion[] {
  const recentWords = getRecentlySeenWords(4);
  if (recentWords.size === 0) return shuffleArray(questions);

  const fresh: ModeQuestion[] = [];
  const recent: ModeQuestion[] = [];

  for (const q of questions) {
    if (recentWords.has(q.word)) {
      recent.push(q);
    } else {
      fresh.push(q);
    }
  }

  return [...shuffleArray(fresh), ...shuffleArray(recent)];
}

/** All question types from the user's tiers, shuffled with anti-repeat. */
export function getShufflePool(prefs: UserPrefs, wordStats?: WordStats): ModeQuestion[] {
  const tiers = getTiersForUser(prefs, wordStats);
  return deprioritizeRecent(getQuestionsByTiers(tiers));
}

/** Single question type from the user's tiers. */
export function getPoolByType(
  prefs: UserPrefs,
  type: QuestionType,
  wordStats?: WordStats
): ModeQuestion[] {
  const tiers = getTiersForUser(prefs, wordStats);
  const questions = getQuestionsByTiers(tiers).filter((q) => q.type === type);
  return deprioritizeRecent(questions);
}

/** Words with <60% accuracy, padded with least-seen words. */
export function getWeakWordsPool(
  prefs: UserPrefs,
  wordStats: WordStats
): ModeQuestion[] {
  const tiers = getTiersForUser(prefs, wordStats);
  const allQuestions = getQuestionsByTiers(tiers);

  const weak: ModeQuestion[] = [];
  const rest: ModeQuestion[] = [];

  for (const q of allQuestions) {
    const stat = wordStats[q.word];
    if (stat && stat.timesSeen >= 1) {
      const accuracy = stat.timesCorrect / stat.timesSeen;
      if (accuracy < 0.6) {
        weak.push(q);
        continue;
      }
    }
    rest.push(q);
  }

  // Pad with least-seen if not enough weak words
  if (weak.length < 10) {
    const sorted = [...rest].sort((a, b) => {
      const aSeen = wordStats[a.word]?.timesSeen ?? 0;
      const bSeen = wordStats[b.word]?.timesSeen ?? 0;
      return aSeen - bSeen;
    });
    weak.push(...sorted.slice(0, 10 - weak.length));
  }

  return deprioritizeRecent(weak);
}

/** 10 random questions for Sprint mode. */
export function getSprintPool(prefs: UserPrefs, wordStats?: WordStats): ModeQuestion[] {
  const pool = getShufflePool(prefs, wordStats);
  return pool.slice(0, 10);
}

/** 10 random questions for Perfection mode. */
export function getPerfectionPool(prefs: UserPrefs, wordStats?: WordStats): ModeQuestion[] {
  const pool = getShufflePool(prefs, wordStats);
  return pool.slice(0, 10);
}

/** 10 random questions for Rush mode (reshuffles on exhaust, like sprint). */
export function getRushPool(prefs: UserPrefs, wordStats?: WordStats): ModeQuestion[] {
  const pool = getShufflePool(prefs, wordStats);
  return pool.slice(0, 10);
}

/** 30 questions spanning all 6 tiers (5 per tier) for level test. */
export function getLevelTestPool(): ModeQuestion[] {
  const pool: ModeQuestion[] = [];
  for (const tier of ALL_TIERS) {
    const tierQs = getQuestionsByTiers([tier]);
    pool.push(...shuffleArray(tierQs).slice(0, 5));
  }
  return pool;
}
