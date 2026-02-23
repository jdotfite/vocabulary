import { clearSessionCookie } from "../_lib/auth.js";

export const config = { runtime: "edge" };

export default function handler(request: Request): Response {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie()
    }
  });
}
