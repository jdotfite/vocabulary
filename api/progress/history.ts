import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

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

    const rows = await sql`
      SELECT
        ps.id,
        COALESCE(dt.mode_id, ps.mode_type) as mode_id,
        ps.score,
        ps.total,
        ps.completed_at
      FROM practice_sessions ps
      LEFT JOIN difficulty_tiers dt ON dt.id = ps.tier_id
      WHERE ps.user_id = ${userId}
      ORDER BY ps.completed_at DESC
      LIMIT 50
    `;

    const sessions = rows.map((row) => {
      const modeId = row.mode_id as string | null;
      return {
        id: row.id as string,
        modeId: modeId ?? "unknown",
        score: row.score as number,
        total: row.total as number,
        completedAt: new Date(row.completed_at as string).toISOString()
      };
    });

    return new Response(JSON.stringify({ sessions }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("History fetch error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
