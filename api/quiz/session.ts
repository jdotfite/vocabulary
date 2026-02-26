import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";
import { buildQuestions, selectAdaptiveWords } from "../_lib/questions.js";

export const config = { runtime: "edge" };

interface SessionRequest {
  mode?: string;
  count?: number;
}

interface UserAbilityRow {
  ability_score: number;
}

// Mode → { count, tierFilter, weakOnly, questionType, stratified }
const MODE_CONFIG: Record<
  string,
  {
    count: number;
    tierFilter?: string;
    weakOnly?: boolean;
    questionType?: "guess_word" | "meaning_match" | "fill_gap";
    stratified?: boolean;
  }
> = {
  shuffle: { count: 15 },
  guess_word: { count: 15, questionType: "guess_word" },
  meaning_match: { count: 15, questionType: "meaning_match" },
  fill_gap: { count: 15, questionType: "fill_gap" },
  weak_words: { count: 15, weakOnly: true },
  sprint: { count: 10 },
  perfection: { count: 10 },
  rush: { count: 10 },
  level_test: { count: 30, stratified: true },
  // Tier modes
  kids_beginner: { count: 15, tierFilter: "kids_beginner" },
  kids_intermediate: { count: 15, tierFilter: "kids_intermediate" },
  kids_advanced: { count: 15, tierFilter: "kids_advanced" },
  adult_beginner: { count: 15, tierFilter: "adult_beginner" },
  adult_intermediate: { count: 15, tierFilter: "adult_intermediate" },
  adult_advanced: { count: 15, tierFilter: "adult_advanced" },
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let userId: string;
  try {
    ({ userId } = await verifySession(request));
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = (await request.json()) as SessionRequest;
    const mode = body.mode ?? "shuffle";

    const config = MODE_CONFIG[mode];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unknown mode: ${mode}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const rawCount = body.count ?? config.count;
    const count = typeof rawCount === "number" && Number.isFinite(rawCount)
      ? Math.min(Math.max(1, Math.round(rawCount)), 50)
      : config.count;
    const sql = getSQL();

    // Get user ability
    const userRows = (await sql`
      SELECT ability_score FROM users WHERE id = ${userId}::uuid
    `) as unknown as UserAbilityRow[];
    const abilityScore = userRows[0]?.ability_score ?? 50;

    // Select words adaptively
    const words = await selectAdaptiveWords(sql, userId, abilityScore, count, {
      tierFilter: config.tierFilter,
      weakOnly: config.weakOnly,
      questionType: config.questionType,
      stratified: config.stratified,
    });

    if (words.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No words available for this mode",
          questions: [],
          abilityScore,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build questions from selected words
    const questions = await buildQuestions(sql, words, config.questionType);

    return new Response(
      JSON.stringify({
        questions,
        abilityScore,
        wordCount: words.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Quiz session error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
