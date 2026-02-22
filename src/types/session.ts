import type { QuizAnswerRecord } from "@/game/quizReducer";
import type { ModeId } from "@/types/content";

export interface CompletedQuizPayload {
  modeId: ModeId;
  score: number;
  total: number;
  answers: QuizAnswerRecord[];
  completedAt: string;
}
