import { jwtVerify, SignJWT } from "jose";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

const COOKIE_NAME = "session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const IS_SECURE = process.env.VERCEL_ENV !== undefined; // Secure on all Vercel envs (production + preview)

export interface SessionPayload {
  userId: string;
}

export async function verifySession(request: Request): Promise<SessionPayload> {
  const cookie = request.headers.get("cookie") ?? "";
  const re = new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`);
  const match = re.exec(cookie);
  if (!match?.[1]) throw new Error("No session cookie");

  const { payload } = await jwtVerify(match[1], getJwtSecret());
  if (typeof payload.userId !== "string") throw new Error("Invalid session");

  return { userId: payload.userId };
}

export async function createSessionCookie(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .setIssuedAt()
    .sign(getJwtSecret());

  const secure = IS_SECURE ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`;
}

export function clearSessionCookie(): string {
  const secure = IS_SECURE ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`;
}
