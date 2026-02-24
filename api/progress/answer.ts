import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

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
    const { word, isCorrect } = (await request.json()) as {
      word?: string;
      isCorrect?: boolean;
    };

    if (!word || typeof isCorrect !== "boolean") {
      return new Response("Invalid body", { status: 400 });
    }

    const sql = getSQL();
    const correctInc = isCorrect ? 1 : 0;
    const incorrectInc = isCorrect ? 0 : 1;
    const newStreak = isCorrect ? 1 : 0;

    await sql`
      INSERT INTO user_word_stats (user_id, word_id, times_seen, times_correct, times_incorrect, streak, last_seen_at)
      SELECT ${userId}, w.id, 1, ${correctInc}, ${incorrectInc}, ${newStreak}, now()
      FROM words w WHERE w.word = ${word}
      ON CONFLICT (user_id, word_id) DO UPDATE SET
        times_seen = user_word_stats.times_seen + 1,
        times_correct = user_word_stats.times_correct + ${correctInc},
        times_incorrect = user_word_stats.times_incorrect + ${incorrectInc},
        streak = CASE WHEN ${isCorrect} THEN user_word_stats.streak + 1 ELSE 0 END,
        last_seen_at = now()
    `;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Answer recording error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
