import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

const VALID_AGE_RANGES = new Set([
  "13-17",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+"
]);
const VALID_GENDERS = new Set([
  "female",
  "male",
  "other",
  "prefer_not_to_say"
]);
const VALID_VOCAB_LEVELS = new Set(["beginner", "intermediate", "advanced"]);

interface OnboardingBody {
  ageRange?: string | null;
  gender?: string | null;
  nickname?: string | null;
  vocabularyLevel?: string | null;
  knownWords?: string[];
}

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
    const body = (await request.json()) as OnboardingBody;

    const ageRange =
      typeof body.ageRange === "string" && VALID_AGE_RANGES.has(body.ageRange)
        ? body.ageRange
        : null;
    const gender =
      typeof body.gender === "string" && VALID_GENDERS.has(body.gender)
        ? body.gender
        : null;
    const nickname =
      typeof body.nickname === "string" && body.nickname.trim().length > 0
        ? body.nickname.trim().slice(0, 50)
        : null;
    const vocabularyLevel =
      typeof body.vocabularyLevel === "string" &&
      VALID_VOCAB_LEVELS.has(body.vocabularyLevel)
        ? body.vocabularyLevel
        : null;
    const knownWords = Array.isArray(body.knownWords)
      ? body.knownWords.filter(
          (w): w is string => typeof w === "string" && w.length > 0
        )
      : [];

    const sql = getSQL();

    await sql`
      INSERT INTO user_preferences (user_id, age_range, gender, nickname, vocabulary_level, known_words, updated_at)
      VALUES (${userId}, ${ageRange}, ${gender}, ${nickname}, ${vocabularyLevel}, ${JSON.stringify(knownWords)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE SET
        age_range = EXCLUDED.age_range,
        gender = EXCLUDED.gender,
        nickname = EXCLUDED.nickname,
        vocabulary_level = EXCLUDED.vocabulary_level,
        known_words = EXCLUDED.known_words,
        updated_at = now()
    `;

    await sql`
      UPDATE users SET onboarding_completed = true WHERE id = ${userId}
    `;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Onboarding complete error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
