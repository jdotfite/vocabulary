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

export function getDailyHomeInsight(date: Date = new Date()): string {
  return pickDeterministic(DAILY_HOME_INSIGHTS, `home:${getLocalDayKey(date)}`);
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
