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
    const { dismissed } = (await request.json()) as { dismissed?: boolean };

    if (typeof dismissed !== "boolean") {
      return new Response("Invalid body", { status: 400 });
    }

    const sql = getSQL();

    await sql`
      UPDATE user_preferences
      SET splash_dismissed = ${dismissed}, updated_at = now()
      WHERE user_id = ${userId}
    `;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Splash toggle error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
