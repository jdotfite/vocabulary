import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

interface UserRow {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userId } = await verifySession(request);
    const sql = getSQL();

    const rows = (await sql`
      SELECT id, display_name, email, avatar_url FROM users WHERE id = ${userId}
    `) as unknown as UserRow[];

    const user = rows[0];
    if (!user) {
      return new Response("User not found", { status: 401 });
    }

    return new Response(
      JSON.stringify({
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        avatarUrl: user.avatar_url
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
