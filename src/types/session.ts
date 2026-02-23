import type { QuizAnswerRecord } from "@/game/quizReducer";
import type { AnyModeId } from "@/types/content";

export interface CompletedQuizPayload {
  modeId: AnyModeId;
  score: number;
  total: number;
  answers: QuizAnswerRecord[];
  completedAt: string;
}
