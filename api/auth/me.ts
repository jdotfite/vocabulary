import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

interface UserRow {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
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

    const rows = (await sql`
      SELECT id, display_name, email, avatar_url, onboarding_completed FROM users WHERE id = ${userId}
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
        avatarUrl: user.avatar_url,
        onboardingCompleted: user.onboarding_completed
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    console.error("Session lookup error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
