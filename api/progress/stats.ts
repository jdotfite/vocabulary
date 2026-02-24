import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
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

    const [sessionsRows, favCountRows, bookCountRows] = await Promise.all([
      sql`
        SELECT COALESCE(dt.mode_id, ps.mode_type) as mode_id, ps.score, ps.total, ps.completed_at
        FROM practice_sessions ps
        LEFT JOIN difficulty_tiers dt ON dt.id = ps.tier_id
        WHERE ps.user_id = ${userId}
        ORDER BY ps.completed_at DESC
      `,
      sql`SELECT COUNT(*) as count FROM user_favorites WHERE user_id = ${userId}`,
      sql`SELECT COUNT(*) as count FROM user_bookmarks WHERE user_id = ${userId}`
    ]);

    // Build day set for streak calculation
    const daySet = new Set<string>();
    for (const row of sessionsRows) {
      const d = new Date(row.completed_at as string);
      if (!isNaN(d.getTime())) daySet.add(toDateKey(d));
    }

    // Streak calculation — anchored to today
    let streakCount = 0;
    const today = new Date();
    const todayKey = toDateKey(today);
    const yesterdayKey = toDateKey(addDays(today, -1));

    if (daySet.has(todayKey)) {
      let cursor = today;
      while (daySet.has(toDateKey(cursor))) {
        streakCount++;
        cursor = addDays(cursor, -1);
      }
    } else if (daySet.has(yesterdayKey)) {
      let cursor = addDays(today, -1);
      while (daySet.has(toDateKey(cursor))) {
        streakCount++;
        cursor = addDays(cursor, -1);
      }
    }

    // Week activity — anchored to current week
    const weekStart = addDays(today, -today.getDay());
    const weekActivity = WEEKDAY_LABELS.map((label, index) => {
      const current = addDays(weekStart, index);
      return { label, isActive: daySet.has(toDateKey(current)) };
    });

    // Last practice
    const lastPractice = sessionsRows[0]
      ? {
          modeId: sessionsRows[0].mode_id as string,
          score: sessionsRows[0].score as number,
          total: sessionsRows[0].total as number,
          completedAt: new Date(
            sessionsRows[0].completed_at as string
          ).toISOString()
        }
      : null;

    // Words read = sum of all totals
    let wordsRead = 0;
    for (const row of sessionsRows) {
      wordsRead += row.total as number;
    }

    return new Response(
      JSON.stringify({
        lastPractice,
        streakCount,
        weekActivity,
        wordsRead,
        practices: sessionsRows.length,
        favoritedCount: Number(favCountRows[0]?.count ?? 0),
        bookmarkedCount: Number(bookCountRows[0]?.count ?? 0)
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    console.error("Stats fetch error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
