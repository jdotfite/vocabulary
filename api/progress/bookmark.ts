import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userId } = await verifySession(request);
    const { word } = (await request.json()) as { word?: string };

    if (!word) {
      return new Response("Invalid body", { status: 400 });
    }

    const sql = getSQL();

    const deleted = await sql`
      DELETE FROM user_bookmarks
      WHERE user_id = ${userId} AND word_id = (SELECT id FROM words WHERE word = ${word})
      RETURNING id
    `;

    if (deleted.length === 0) {
      await sql`
        INSERT INTO user_bookmarks (user_id, word_id)
        SELECT ${userId}, id FROM words WHERE word = ${word}
        ON CONFLICT DO NOTHING
      `;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
