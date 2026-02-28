const DAILY_HOME_INSIGHTS = [
  "Every learned word removes friction from the next page.",
  "Vocabulary growth is comprehension growth.",
  "Small daily reps turn hard reading into easier reading.",
  "Stronger vocabulary makes new ideas easier to absorb.",
  "One useful word a day compounds into better fluency.",
  "Precision in language builds confidence in communication.",
  "Word practice today makes recall faster tomorrow.",
  "Better vocabulary helps you learn everything else faster."
] as const;

const HOME_CONTEXT_INSIGHTS = {
  review: [
    "Review turns shaky words into reliable recall.",
    "A quick revisit is often what makes a hard word stick.",
    "Fresh review reps are how weak words become usable words."
  ],
  streak: [
    "Consistency beats intensity when you are building recall.",
    "Keeping the chain alive makes vocabulary feel easier over time.",
    "Daily exposure is what turns recognition into confidence."
  ],
  mastery: [
    "Mastered words free up attention for harder ones.",
    "Each mastered word makes the next challenge more manageable.",
    "Strong foundations make advanced vocabulary easier to absorb."
  ],
  accuracy: [
    "Clean repetitions strengthen memory faster than random exposure.",
    "Accurate recall is a sign that the reps are paying off.",
    "Good accuracy usually means faster comprehension later."
  ]
} as const;

const CHALLENGE_INSIGHTS: Record<string, readonly string[]> = {
  sprint: [
    "Fast recall is how recognition becomes instinct.",
    "Quick wins train your brain to spot meaning faster.",
    "Short bursts make word retrieval feel automatic."
  ],
  rush: [
    "Quick retrieval helps vocabulary show up in real moments.",
    "Speed under pressure turns passive words into active ones.",
    "Fast thinking makes familiar words easier to reach."
  ],
  perfection: [
    "Careful accuracy builds durable word memory.",
    "Slow, correct reps help words stick longer.",
    "Precision now means fewer misses later."
  ],
  level_test: [
    "A clear benchmark makes progress easier to feel.",
    "Measuring your level turns future gains into visible wins.",
    "Good calibration is the first step to better growth."
  ]
};

const SUMMARY_INSIGHTS = {
  strong: [
    "Strong sessions make hard words feel familiar faster.",
    "Clean runs build momentum. Keep stacking them.",
    "When recall feels easier, comprehension usually follows."
  ],
  steady: [
    "Progress comes from steady reps, not perfect sessions.",
    "Each round adds another layer of familiarity.",
    "Consistency is what turns exposure into retention."
  ],
  rebuild: [
    "Every miss is useful data. The next round gets smarter.",
    "Hard words become easier after enough clean repetitions.",
    "Even rough sessions strengthen future recall."
  ]
} as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getLocalDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pickDeterministic<T>(items: readonly T[], seed: string): T {
  const index = hashSeed(seed) % items.length;
  return items[index] as T;
}

export function getDailyHomeInsight(
  options?: {
    streakCount?: number;
    wordsForReview?: number;
    wordsMastered?: number;
    accuracy?: number;
  },
  date: Date = new Date()
): string {
  const streakCount = options?.streakCount ?? 0;
  const wordsForReview = options?.wordsForReview ?? 0;
  const wordsMastered = options?.wordsMastered ?? 0;
  const accuracy = options?.accuracy ?? 0;
  const dayKey = getLocalDayKey(date);

  if (wordsForReview > 0) {
    return pickDeterministic(
      HOME_CONTEXT_INSIGHTS.review,
      `home:review:${dayKey}`
    );
  }

  if (streakCount >= 3) {
    return pickDeterministic(
      HOME_CONTEXT_INSIGHTS.streak,
      `home:streak:${dayKey}`
    );
  }

  if (wordsMastered >= 10) {
    return pickDeterministic(
      HOME_CONTEXT_INSIGHTS.mastery,
      `home:mastery:${dayKey}`
    );
  }

  if (accuracy >= 80) {
    return pickDeterministic(
      HOME_CONTEXT_INSIGHTS.accuracy,
      `home:accuracy:${dayKey}`
    );
  }

  return pickDeterministic(DAILY_HOME_INSIGHTS, `home:base:${dayKey}`);
}

export function getChallengeInsight(
  challengeType: string,
  date: Date = new Date()
): string {
  const pool = CHALLENGE_INSIGHTS[challengeType] ?? DAILY_HOME_INSIGHTS;
  return pickDeterministic(
    pool,
    `challenge:${challengeType}:${getLocalDayKey(date)}`
  );
}

export function getSummaryInsight(
  score: number,
  total: number,
  date: Date = new Date()
): string {
  const ratio = total > 0 ? score / total : 0;
  const band =
    ratio >= 0.8 ? "strong" : ratio >= 0.6 ? "steady" : "rebuild";
  const pool = SUMMARY_INSIGHTS[band];
  return pickDeterministic(
    pool,
    `summary:${band}:${getLocalDayKey(date)}`
  );
}
