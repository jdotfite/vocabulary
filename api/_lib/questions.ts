/**
 * Dynamic question assembly — builds quiz questions from DB words.
 */

import type { NeonQueryFunction } from "@neondatabase/serverless";

export interface GeneratedQuestion {
  id: string;
  wordId: string;
  type: "guess_word" | "meaning_match" | "fill_gap";
  prompt: string;
  word: string;
  phonetic: string;
  definition: string;
  sentence: string;
  options: [string, string, string];
  correctOptionIndex: 0 | 1 | 2;
  difficultyScore: number;
}

interface WordRow {
  id: string;
  word: string;
  phonetic: string;
  definition: string;
  sentence: string | null;
  gap_sentence: string | null;
  difficulty_score: number | null;
  mode_id: string;
}

const QUESTION_TYPES = ["guess_word", "meaning_match", "fill_gap"] as const;

function shuffleArray<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

/**
 * Pick distractors for a target word from nearby-difficulty words.
 * Returns 2 distractor WordRows.
 */
async function pickDistractors(
  sql: NeonQueryFunction<false, false>,
  targetWordId: string,
  targetDifficulty: number
): Promise<WordRow[]> {
  const rows = (await sql`
    SELECT w.id, w.word, w.phonetic, w.definition, w.sentence, w.gap_sentence,
           w.difficulty_score, dt.mode_id
    FROM words w
    JOIN difficulty_tiers dt ON dt.id = w.tier_id
    WHERE w.id != ${targetWordId}::uuid
      AND w.difficulty_score BETWEEN ${targetDifficulty - 20} AND ${targetDifficulty + 20}
    ORDER BY random()
    LIMIT 10
  `) as unknown as WordRow[];

  if (rows.length >= 2) return rows.slice(0, 2);

  // Fallback: get any 2 random words
  const fallback = (await sql`
    SELECT w.id, w.word, w.phonetic, w.definition, w.sentence, w.gap_sentence,
           w.difficulty_score, dt.mode_id
    FROM words w
    JOIN difficulty_tiers dt ON dt.id = w.tier_id
    WHERE w.id != ${targetWordId}::uuid
    ORDER BY random()
    LIMIT 2
  `) as unknown as WordRow[];

  return fallback;
}

/**
 * Assemble a single question from a target word + distractors.
 */
function assembleQuestion(
  target: WordRow,
  distractors: [WordRow, WordRow],
  typeOverride?: "guess_word" | "meaning_match" | "fill_gap"
): GeneratedQuestion {
  const d0 = distractors[0];
  const d1 = distractors[1];

  // Choose question type
  let type = typeOverride;
  if (!type) {
    // If word has a gap_sentence, allow fill_gap; otherwise pick from first two types
    const available = target.gap_sentence
      ? QUESTION_TYPES
      : QUESTION_TYPES.filter((t) => t !== "fill_gap");
    type = available[Math.floor(Math.random() * available.length)] ?? "guess_word";
  }

  // If fill_gap requested but no gap_sentence, fall back to guess_word
  if (type === "fill_gap" && !target.gap_sentence) {
    type = "guess_word";
  }

  // Build options and prompt based on type
  const correctIndex = Math.floor(Math.random() * 3) as 0 | 1 | 2;
  let prompt: string;
  let options: [string, string, string];

  if (type === "meaning_match") {
    // Prompt = word, options = definitions
    prompt = target.word;
    const defs = [d0.definition, d1.definition];
    const allOpts = [...defs];
    allOpts.splice(correctIndex, 0, target.definition);
    options = allOpts as [string, string, string];
  } else if (type === "fill_gap") {
    // Prompt = gap sentence, options = words
    prompt = target.gap_sentence ?? target.definition;
    const words = [d0.word, d1.word];
    const allOpts = [...words];
    allOpts.splice(correctIndex, 0, target.word);
    options = allOpts as [string, string, string];
  } else {
    // guess_word: prompt = definition, options = words
    prompt = target.definition;
    const words = [d0.word, d1.word];
    const allOpts = [...words];
    allOpts.splice(correctIndex, 0, target.word);
    options = allOpts as [string, string, string];
  }

  return {
    id: `dyn_${target.id.slice(0, 8)}_${Date.now().toString(36)}`,
    wordId: target.id,
    type,
    prompt,
    word: target.word,
    phonetic: target.phonetic,
    definition: target.definition,
    sentence: target.sentence ?? `The word is "${target.word}".`,
    options,
    correctOptionIndex: correctIndex,
    difficultyScore: target.difficulty_score ?? 50,
  };
}

/**
 * Build a full set of questions from selected words.
 */
export async function buildQuestions(
  sql: NeonQueryFunction<false, false>,
  words: WordRow[],
  typeOverride?: "guess_word" | "meaning_match" | "fill_gap"
): Promise<GeneratedQuestion[]> {
  const questions: GeneratedQuestion[] = [];

  for (const word of words) {
    const distractors = await pickDistractors(
      sql,
      word.id,
      word.difficulty_score ?? 50
    );
    const d0 = distractors[0];
    const d1 = distractors[1];
    if (!d0 || !d1) continue;
    questions.push(assembleQuestion(word, [d0, d1], typeOverride));
  }

  return questions;
}

/**
 * Select words adaptively for a quiz session.
 * 3 buckets: due-for-review wrong (40%), new frontier (40%), due-for-review correct (20%).
 */
export async function selectAdaptiveWords(
  sql: NeonQueryFunction<false, false>,
  userId: string,
  abilityScore: number,
  count: number,
  options?: {
    tierFilter?: string | undefined;
    weakOnly?: boolean | undefined;
    questionType?: "guess_word" | "meaning_match" | "fill_gap" | undefined;
    stratified?: boolean | undefined;
  }
): Promise<WordRow[]> {
  const tierFilter = options?.tierFilter;
  const weakOnly = options?.weakOnly ?? false;

  if (weakOnly) {
    return selectWeakWords(sql, userId, count, tierFilter);
  }

  if (options?.stratified) {
    return selectStratifiedWords(sql, count);
  }

  // Target counts per bucket
  const dueWrongCount = Math.round(count * 0.4);
  const frontierCount = Math.round(count * 0.4);
  const dueCorrectCount = count - dueWrongCount - frontierCount;

  // Bucket 1: Due-for-review words the user got wrong (poor accuracy)
  const dueWrong = (await sql`
    SELECT w.id, w.word, w.phonetic, w.definition, w.sentence, w.gap_sentence,
           w.difficulty_score, dt.mode_id
    FROM words w
    JOIN difficulty_tiers dt ON dt.id = w.tier_id
    JOIN user_word_stats uws ON uws.word_id = w.id AND uws.user_id = ${userId}::uuid
    WHERE uws.next_review_at <= now()
      AND uws.times_incorrect > uws.times_correct
      ${tierFilter ? sql`AND dt.mode_id = ${tierFilter}` : sql``}
    ORDER BY uws.next_review_at ASC
    LIMIT ${dueWrongCount}
  `) as unknown as WordRow[];

  // Bucket 2: New frontier words near user's ability
  const targetDifficulty = abilityScore + 13; // ~70% expected accuracy
  const seenWordIds =
    dueWrong.length > 0
      ? dueWrong.map((w) => w.id)
      : ["00000000-0000-0000-0000-000000000000"];

  const frontier = (await sql`
    SELECT w.id, w.word, w.phonetic, w.definition, w.sentence, w.gap_sentence,
           w.difficulty_score, dt.mode_id
    FROM words w
    JOIN difficulty_tiers dt ON dt.id = w.tier_id
    LEFT JOIN user_word_stats uws ON uws.word_id = w.id AND uws.user_id = ${userId}::uuid
    WHERE (uws.id IS NULL OR uws.times_seen = 0)
      AND w.id != ALL(${seenWordIds}::uuid[])
      ${tierFilter ? sql`AND dt.mode_id = ${tierFilter}` : sql``}
    ORDER BY ABS(COALESCE(w.difficulty_score, 50) - ${targetDifficulty}), random()
    LIMIT ${frontierCount}
  `) as unknown as WordRow[];

  // Bucket 3: Due-for-review correct words (reinforcement)
  const usedIds = [...dueWrong, ...frontier].map((w) => w.id);
  const excludeIds =
    usedIds.length > 0
      ? usedIds
      : ["00000000-0000-0000-0000-000000000000"];

  const dueCorrect = (await sql`
    SELECT w.id, w.word, w.phonetic, w.definition, w.sentence, w.gap_sentence,
           w.difficulty_score, dt.mode_id
    FROM words w
    JOIN difficulty_tiers dt ON dt.id = w.tier_id
    JOIN user_word_stats uws ON uws.word_id = w.id AND uws.user_id = ${userId}::uuid
    WHERE uws.next_review_at <= now()
      AND uws.times_correct >= uws.times_incorrect
      AND w.id != ALL(${excludeIds}::uuid[])
      ${tierFilter ? sql`AND dt.mode_id = ${tierFilter}` : sql``}
    ORDER BY uws.next_review_at ASC
    LIMIT ${dueCorrectCount}
  `) as unknown as WordRow[];

  let selected = [...dueWrong, ...frontier, ...dueCorrect];

  // If we don't have enough, pad with random unseen/least-seen words
  if (selected.length < count) {
    const haveIds =
      selected.length > 0
        ? selected.map((w) => w.id)
        : ["00000000-0000-0000-0000-000000000000"];
    const padding = (await sql`
      SELECT w.id, w.word, w.phonetic, w.definition, w.sentence, w.gap_sentence,
             w.difficulty_score, dt.mode_id
      FROM words w
      JOIN difficulty_tiers dt ON dt.id = w.tier_id
      LEFT JOIN user_word_stats uws ON uws.word_id = w.id AND uws.user_id = ${userId}::uuid
      WHERE w.id != ALL(${haveIds}::uuid[])
        ${tierFilter ? sql`AND dt.mode_id = ${tierFilter}` : sql``}
      ORDER BY COALESCE(uws.times_seen, 0) ASC, ABS(COALESCE(w.difficulty_score, 50) - ${abilityScore}), random()
      LIMIT ${count - selected.length}
    `) as unknown as WordRow[];
    selected = [...selected, ...padding];
  }

  return shuffleArray(selected).slice(0, count);
}

async function selectWeakWords(
  sql: NeonQueryFunction<false, false>,
  userId: string,
  count: number,
  tierFilter?: string
): Promise<WordRow[]> {
  const weak = (await sql`
    SELECT w.id, w.word, w.phonetic, w.definition, w.sentence, w.gap_sentence,
           w.difficulty_score, dt.mode_id
    FROM words w
    JOIN difficulty_tiers dt ON dt.id = w.tier_id
    JOIN user_word_stats uws ON uws.word_id = w.id AND uws.user_id = ${userId}::uuid
    WHERE uws.times_seen >= 1
      AND uws.times_correct::float / GREATEST(uws.times_seen, 1) < 0.6
      ${tierFilter ? sql`AND dt.mode_id = ${tierFilter}` : sql``}
    ORDER BY uws.times_correct::float / GREATEST(uws.times_seen, 1) ASC
    LIMIT ${count}
  `) as unknown as WordRow[];

  if (weak.length >= count) return shuffleArray(weak);

  // Pad with least-seen words
  const haveIds =
    weak.length > 0
      ? weak.map((w) => w.id)
      : ["00000000-0000-0000-0000-000000000000"];
  const padding = (await sql`
    SELECT w.id, w.word, w.phonetic, w.definition, w.sentence, w.gap_sentence,
           w.difficulty_score, dt.mode_id
    FROM words w
    JOIN difficulty_tiers dt ON dt.id = w.tier_id
    LEFT JOIN user_word_stats uws ON uws.word_id = w.id AND uws.user_id = ${userId}::uuid
    WHERE w.id != ALL(${haveIds}::uuid[])
      ${tierFilter ? sql`AND dt.mode_id = ${tierFilter}` : sql``}
    ORDER BY COALESCE(uws.times_seen, 0) ASC
    LIMIT ${count - weak.length}
  `) as unknown as WordRow[];

  return shuffleArray([...weak, ...padding]);
}

async function selectStratifiedWords(
  sql: NeonQueryFunction<false, false>,
  count: number
): Promise<WordRow[]> {
  // Select evenly across difficulty quintiles for level test
  const perQuintile = Math.ceil(count / 5);
  const boundaries = [0, 20, 40, 60, 80, 100];
  const allWords: WordRow[] = [];

  for (let i = 0; i < 5; i++) {
    const rows = (await sql`
      SELECT w.id, w.word, w.phonetic, w.definition, w.sentence, w.gap_sentence,
             w.difficulty_score, dt.mode_id
      FROM words w
      JOIN difficulty_tiers dt ON dt.id = w.tier_id
      WHERE w.difficulty_score >= ${boundaries[i] ?? 0}
        AND w.difficulty_score < ${boundaries[i + 1] ?? 100}
      ORDER BY random()
      LIMIT ${perQuintile}
    `) as unknown as WordRow[];
    allWords.push(...rows);
  }

  return shuffleArray(allWords).slice(0, count);
}
