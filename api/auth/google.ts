import { createRemoteJWKSet, jwtVerify } from "jose";

import { createSessionCookie } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

interface UserRow {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { credential } = (await request.json()) as { credential?: string };
  if (!credential) {
    return new Response("Missing credential", { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return new Response("Server misconfigured", { status: 500 });
  }

  let payload;
  try {
    ({ payload } = await jwtVerify(credential, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId
    }));
  } catch (err) {
    console.error("Google token verification failed:", err);
    return new Response("Authentication failed", { status: 401 });
  }

  if (typeof payload.sub !== "string") {
    return new Response("Invalid token: missing sub", { status: 401 });
  }

  if (payload.email_verified !== true) {
    return new Response("Email not verified", { status: 403 });
  }

  const googleId = payload.sub;
  const email = typeof payload.email === "string" ? payload.email : null;
  const displayName = typeof payload.name === "string" ? payload.name : null;
  const avatarUrl =
    typeof payload.picture === "string" ? payload.picture : null;

  try {
    const sql = getSQL();
    const rows = (await sql`
      INSERT INTO users (google_id, email, display_name, avatar_url, last_seen_at)
      VALUES (${googleId}, ${email}, ${displayName}, ${avatarUrl}, now())
      ON CONFLICT (google_id) DO UPDATE
        SET email = EXCLUDED.email,
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url,
            last_seen_at = now()
      RETURNING id, display_name, email, avatar_url
    `) as unknown as UserRow[];

    const user = rows[0];
    if (!user) {
      return new Response("User creation failed", { status: 500 });
    }

    const cookie = await createSessionCookie(user.id);

    return new Response(
      JSON.stringify({
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        avatarUrl: user.avatar_url
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie
        }
      }
    );
  } catch (err) {
    console.error("Google auth DB error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
