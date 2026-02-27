export interface QuizAnswerRecord {
  questionId: string;
  wordId?: string | undefined;
  questionType?: string | undefined;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  word?: string | undefined;
  definition?: string | undefined;
  phonetic?: string | undefined;
  sentence?: string | undefined;
}

export type ChallengeMode = "standard" | "sprint" | "perfection" | "rush";

export interface QuizState {
  totalQuestions: number;
  currentIndex: number;
  selectedOptionIndex: number | null;
  isAnswered: boolean;
  score: number;
  status: "playing" | "finished";
  answers: QuizAnswerRecord[];
  challengeMode: ChallengeMode;
  lives: number;
  maxLives: number;
}

export type QuizAction =
  | {
      type: "selectOption";
      questionId: string;
      wordId?: string | undefined;
      questionType?: string | undefined;
      optionIndex: number;
      correctOptionIndex: number;
      word?: string | undefined;
      definition?: string | undefined;
      phonetic?: string | undefined;
      sentence?: string | undefined;
    }
  | { type: "nextQuestion" }
  | { type: "reset"; totalQuestions: number; challengeMode?: ChallengeMode; lives?: number }
  | { type: "sprintReshuffle"; totalQuestions: number }
  | { type: "rushReshuffle"; totalQuestions: number }
  | { type: "perfectionReshuffle"; totalQuestions: number }
  | { type: "failPerfection" }
  | { type: "timeUp" };

export function createInitialQuizState(
  totalQuestions: number,
  challengeMode: ChallengeMode = "standard",
  lives = Infinity
): QuizState {
  return {
    totalQuestions,
    currentIndex: 0,
    selectedOptionIndex: null,
    isAnswered: false,
    score: 0,
    status: totalQuestions > 0 ? "playing" : "finished",
    answers: [],
    challengeMode,
    lives,
    maxLives: lives
  };
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "selectOption": {
      if (state.status === "finished" || state.isAnswered) {
        return state;
      }

      const isCorrect = action.optionIndex === action.correctOptionIndex;
      const newLives = !isCorrect && state.lives !== Infinity
        ? state.lives - 1
        : state.lives;
      // Perfection uses a feedback sheet, so don't auto-finish — let failPerfection handle it
      const isDead = newLives <= 0 && state.challengeMode !== "perfection";

      return {
        ...state,
        selectedOptionIndex: action.optionIndex,
        isAnswered: true,
        score: isCorrect ? state.score + 1 : state.score,
        lives: newLives,
        status: isDead ? "finished" : state.status,
        answers: [
          ...state.answers,
          {
            questionId: action.questionId,
            wordId: action.wordId,
            questionType: action.questionType,
            selectedOptionIndex: action.optionIndex,
            correctOptionIndex: action.correctOptionIndex,
            isCorrect,
            word: action.word,
            definition: action.definition,
            phonetic: action.phonetic,
            sentence: action.sentence
          }
        ]
      };
    }

    case "nextQuestion": {
      if (state.status === "finished" || !state.isAnswered) {
        return state;
      }

      const isLastQuestion = state.currentIndex >= state.totalQuestions - 1;

      if (isLastQuestion) {
        return {
          ...state,
          status: "finished"
        };
      }

      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        selectedOptionIndex: null,
        isAnswered: false
      };
    }

    case "reset": {
      return createInitialQuizState(
        action.totalQuestions,
        action.challengeMode ?? "standard",
        action.lives ?? Infinity
      );
    }

    case "sprintReshuffle": {
      if (state.challengeMode !== "sprint") return state;
      return {
        ...state,
        totalQuestions: action.totalQuestions,
        currentIndex: 0,
        selectedOptionIndex: null,
        isAnswered: false
        // score and answers are preserved
      };
    }

    case "rushReshuffle": {
      if (state.challengeMode !== "rush") return state;
      return {
        ...state,
        totalQuestions: action.totalQuestions,
        currentIndex: 0,
        selectedOptionIndex: null,
        isAnswered: false
        // score, answers, and lives are preserved
      };
    }

    case "perfectionReshuffle": {
      if (state.challengeMode !== "perfection") return state;
      return {
        ...state,
        totalQuestions: action.totalQuestions,
        currentIndex: 0,
        selectedOptionIndex: null,
        isAnswered: false
        // score, answers, and lives are preserved
      };
    }

    case "failPerfection": {
      if (state.challengeMode !== "perfection") return state;
      return { ...state, status: "finished" };
    }

    case "timeUp": {
      if (state.challengeMode !== "sprint") return state;
      return { ...state, status: "finished" };
    }

    default: {
      return state;
    }
  }
}
