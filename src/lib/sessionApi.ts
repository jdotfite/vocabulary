import { apiPost } from "@/lib/api";
import type { AnyModeId, QuestionType } from "@/types/content";

export interface AdaptiveQuestion {
  id: string;
  wordId: string;
  type: QuestionType;
  prompt: string;
  word: string;
  phonetic: string;
  definition: string;
  sentence: string;
  options: [string, string, string];
  correctOptionIndex: 0 | 1 | 2;
  difficultyScore: number;
}

interface SessionResponse {
  questions: AdaptiveQuestion[];
  abilityScore: number;
  wordCount: number;
  error?: string;
}

/**
 * Fetch a quiz session from the adaptive API.
 * Returns dynamically assembled questions based on user ability + SRS state.
 */
export async function fetchAdaptiveSession(
  mode: AnyModeId,
  count?: number
): Promise<SessionResponse> {
  return apiPost<SessionResponse>("/api/quiz/session", { mode, count });
}
