import { verifySession } from "../_lib/auth.js";
import { getSQL } from "../_lib/db.js";

export const config = { runtime: "edge" };

interface AnswerRecord {
  questionId: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
}

interface SessionBody {
  modeId?: string;
  modeType?: string;
  score?: number;
  total?: number;
  answers?: AnswerRecord[];
  completedAt?: string;
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
    const body = (await request.json()) as SessionBody;

    if (
      typeof body.score !== "number" ||
      typeof body.total !== "number" ||
      !body.completedAt
    ) {
      return new Response("Invalid body", { status: 400 });
    }

    const sql = getSQL();

    // Insert practice session — either tier-based (legacy) or pseudo-mode
    let sessionRows;
    if (body.modeType) {
      // Pseudo-mode: no tier_id, store mode_type
      sessionRows = await sql`
        INSERT INTO practice_sessions (user_id, tier_id, mode_type, score, total, completed_at)
        VALUES (${userId}, NULL, ${body.modeType}, ${body.score}, ${body.total}, ${body.completedAt})
        RETURNING id
      `;
    } else if (body.modeId) {
      // Legacy tier-based session
      sessionRows = await sql`
        INSERT INTO practice_sessions (user_id, tier_id, score, total, completed_at)
        SELECT ${userId}, dt.id, ${body.score}, ${body.total}, ${body.completedAt}
        FROM difficulty_tiers dt WHERE dt.mode_id = ${body.modeId}
        RETURNING id
      `;
    } else {
      return new Response("Invalid body: modeId or modeType required", { status: 400 });
    }

    // Insert review_log entries if answers provided
    if (sessionRows[0] && body.answers && body.answers.length > 0) {
      const sessionId = sessionRows[0].id as string;

      for (const answer of body.answers) {
        await sql`
          INSERT INTO review_log (user_id, session_id, question_id, word_id, selected_index, correct_index, is_correct)
          SELECT ${userId}, ${sessionId}, q.id, q.word_id, ${answer.selectedOptionIndex}, ${answer.correctOptionIndex}, ${answer.isCorrect}
          FROM questions q WHERE q.question_id = ${answer.questionId}
        `;
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Session recording error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
