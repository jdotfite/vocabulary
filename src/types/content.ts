export type QuestionType = "guess_word" | "meaning_match" | "fill_gap";

export type ModeId =
  | "kids_beginner"
  | "kids_intermediate"
  | "kids_advanced"
  | "adult_beginner"
  | "adult_intermediate"
  | "adult_advanced";

/** Pseudo-modes that assemble questions from the user's tier pool. */
export type PseudoModeId =
  | "shuffle"
  | "guess_word"
  | "meaning_match"
  | "fill_gap"
  | "weak_words"
  | "sprint"
  | "perfection";

/** Any valid mode identifier — real tier or pseudo-mode. */
export type AnyModeId = ModeId | PseudoModeId;

export interface ModeQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  word: string;
  phonetic: string;
  definition: string;
  sentence: string;
  options: [string, string, string];
  correctOptionIndex: 0 | 1 | 2;
}

export interface ModeRules {
  minWordLength: number;
  maxWordLength: number;
  allowedQuestionTypes: QuestionType[];
}

export interface ModeMetadata {
  source: string;
  generatedAt: string;
  questionCount: number;
  wordCount: number;
}

export interface ModeContent {
  modeId: ModeId;
  displayName: string;
  audience: "kids" | "adult";
  tier: string;
  gradeBand: string;
  rules: ModeRules;
  questions: ModeQuestion[];
  metadata: ModeMetadata;
}
