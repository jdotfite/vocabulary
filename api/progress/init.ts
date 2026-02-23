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

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userId } = await verifySession(request);
    const sql = getSQL();

    const [rawWordStats, rawFavs, rawBooks] = await Promise.all([
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
      `
    ]);

    const wordStatsRows = rawWordStats as unknown as WordStatRow[];
    const favRows = rawFavs as unknown as WordRow[];
    const bookRows = rawBooks as unknown as WordRow[];

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

    return new Response(
      JSON.stringify({
        wordStats,
        favorites: favRows.map((r) => r.word),
        bookmarks: bookRows.map((r) => r.word)
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
