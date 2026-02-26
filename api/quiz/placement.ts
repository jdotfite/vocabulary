import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";
import { buildQuestions } from "../_lib/questions.js";

export const config = { runtime: "edge" };

interface PlacementRequest {
  targetDifficulty?: number;
  count?: number;
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

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    await verifySession(request);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = (await request.json()) as PlacementRequest;
    const rawDifficulty = body.targetDifficulty ?? 50;
    const targetDifficulty = typeof rawDifficulty === "number" && Number.isFinite(rawDifficulty)
      ? Math.min(Math.max(0, rawDifficulty), 100)
      : 50;
    const rawCount = body.count ?? 5;
    const count = typeof rawCount === "number" && Number.isFinite(rawCount)
      ? Math.min(Math.max(1, Math.round(rawCount)), 10)
      : 5;

    const sql = getSQL();

    const words = (await sql`
      SELECT w.id, w.word, w.phonetic, w.definition, w.sentence, w.gap_sentence,
             w.difficulty_score, dt.mode_id
      FROM words w
      JOIN difficulty_tiers dt ON dt.id = w.tier_id
      ORDER BY ABS(COALESCE(w.difficulty_score, 50) - ${targetDifficulty}), random()
      LIMIT ${count}
    `) as unknown as WordRow[];

    if (words.length === 0) {
      return new Response(
        JSON.stringify({ questions: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const questions = await buildQuestions(sql, words);

    return new Response(
      JSON.stringify({ questions }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Placement quiz error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
