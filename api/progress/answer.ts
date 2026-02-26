import { ELO_K, ELO_SCALE, computeSrsInterval } from "../_lib/adaptive.js";
import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

interface WordRow {
  id: string;
  difficulty_score: number | null;
}

interface AbilityUpdateRow {
  old_ability: number;
  new_ability: number;
}

interface StatsRow {
  streak: number;
}

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

    // Look up word difficulty
    const rawWords = await sql`SELECT id, difficulty_score FROM words WHERE word = ${word}`;
    const wordRows = rawWords as unknown as WordRow[];
    const wordRow = wordRows[0];
    if (!wordRow) {
      return new Response("Word not found", { status: 404 });
    }

    // Upsert word stats (core — works without migrations)
    const correctInc = isCorrect ? 1 : 0;
    const incorrectInc = isCorrect ? 0 : 1;

    const statsRows = (await sql`
      INSERT INTO user_word_stats (user_id, word_id, times_seen, times_correct, times_incorrect, streak, last_seen_at)
      VALUES (${userId}::uuid, ${wordRow.id}::uuid, 1, ${correctInc}, ${incorrectInc}, ${isCorrect ? 1 : 0}, now())
      ON CONFLICT (user_id, word_id) DO UPDATE SET
        times_seen = user_word_stats.times_seen + 1,
        times_correct = user_word_stats.times_correct + ${correctInc},
        times_incorrect = user_word_stats.times_incorrect + ${incorrectInc},
        streak = CASE WHEN ${isCorrect} THEN user_word_stats.streak + 1 ELSE 0 END,
        last_seen_at = now()
      RETURNING streak
    `) as StatsRow[];

    const currentStreak = statsRows[0]?.streak ?? 0;

    // Adaptive features (Elo + SRS) — depend on migration 006.
    // If columns don't exist yet, answer recording still succeeds.
    let newAbility: number | undefined;
    try {
      const wordDifficulty = wordRow.difficulty_score ?? 50;
      const actual = isCorrect ? 1 : 0;

      const abilityRows = (await sql`
        UPDATE users
        SET ability_score = LEAST(100, GREATEST(0,
          ability_score + ${ELO_K} * (
            ${actual} - 1.0 / (1.0 + EXP((${wordDifficulty} - ability_score) / ${ELO_SCALE}))
          )
        ))
        WHERE id = ${userId}::uuid
        RETURNING ability_score AS new_ability,
          ability_score - ${ELO_K} * (
            ${actual} - 1.0 / (1.0 + EXP((${wordDifficulty} - ability_score) / ${ELO_SCALE}))
          ) AS old_ability
      `) as unknown as AbilityUpdateRow[];

      newAbility = abilityRows[0]?.new_ability ?? 50;
      const oldAbility = newAbility - (newAbility - (abilityRows[0]?.old_ability ?? 50));

      const { intervalHours, nextReviewAt } = computeSrsInterval(
        currentStreak,
        isCorrect
      );

      await Promise.all([
        sql`
          UPDATE user_word_stats
          SET srs_interval_hours = ${intervalHours},
              next_review_at = ${nextReviewAt.toISOString()}::timestamptz
          WHERE user_id = ${userId}::uuid AND word_id = ${wordRow.id}::uuid
        `,
        sql`
          INSERT INTO ability_log (user_id, old_score, new_score, word_id, is_correct)
          VALUES (${userId}::uuid, ${oldAbility}, ${newAbility}, ${wordRow.id}::uuid, ${isCorrect})
        `,
      ]);
    } catch {
      // Migration 006 not applied — skip Elo + SRS, answer still recorded
    }

    return new Response(
      JSON.stringify({
        ok: true,
        ...(newAbility !== undefined && { abilityScore: Math.round(newAbility * 10) / 10 }),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Answer recording error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
