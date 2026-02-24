import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

interface WordStatRow {
  word: string;
  times_seen: number;
  times_correct: number;
  times_incorrect: number;
  streak: number;
  last_seen_at: string | null;
}

interface WordRow {
  word: string;
}

interface PreferenceRow {
  nickname: string | null;
  vocabulary_level: string | null;
  age_range: string | null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  let userId: string;
  try {
    ({ userId } = await verifySession(request));
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const sql = getSQL();

    const [rawWordStats, rawFavs, rawBooks, rawPrefs] = await Promise.all([
      sql`
        SELECT w.word, uws.times_seen, uws.times_correct, uws.times_incorrect, uws.streak, uws.last_seen_at
        FROM user_word_stats uws
        JOIN words w ON w.id = uws.word_id
        WHERE uws.user_id = ${userId}
      `,
      sql`
        SELECT w.word FROM user_favorites uf JOIN words w ON w.id = uf.word_id WHERE uf.user_id = ${userId}
      `,
      sql`
        SELECT w.word FROM user_bookmarks ub JOIN words w ON w.id = ub.word_id WHERE ub.user_id = ${userId}
      `,
      sql`
        SELECT nickname, vocabulary_level, age_range
        FROM user_preferences WHERE user_id = ${userId}
        LIMIT 1
      `
    ]);

    const wordStatsRows = rawWordStats as unknown as WordStatRow[];
    const favRows = rawFavs as unknown as WordRow[];
    const bookRows = rawBooks as unknown as WordRow[];
    const prefRows = rawPrefs as unknown as PreferenceRow[];

    const wordStats: Record<
      string,
      {
        timesSeen: number;
        timesCorrect: number;
        timesIncorrect: number;
        streak: number;
        lastSeenAt: string | null;
      }
    > = {};
    for (const row of wordStatsRows) {
      wordStats[row.word] = {
        timesSeen: row.times_seen,
        timesCorrect: row.times_correct,
        timesIncorrect: row.times_incorrect,
        streak: row.streak,
        lastSeenAt: row.last_seen_at
          ? new Date(row.last_seen_at).toISOString()
          : null
      };
    }

    const pref = prefRows[0] ?? null;

    return new Response(
      JSON.stringify({
        wordStats,
        favorites: favRows.map((r) => r.word),
        bookmarks: bookRows.map((r) => r.word),
        nickname: pref?.nickname ?? null,
        vocabularyLevel: pref?.vocabulary_level ?? null,
        ageRange: pref?.age_range ?? null
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    console.error("Init fetch error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
