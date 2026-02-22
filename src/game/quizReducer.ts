export interface QuizAnswerRecord {
  questionId: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
}

export interface QuizState {
  totalQuestions: number;
  currentIndex: number;
  selectedOptionIndex: number | null;
  isAnswered: boolean;
  score: number;
  status: "playing" | "finished";
  answers: QuizAnswerRecord[];
}

export type QuizAction =
  | {
      type: "selectOption";
      questionId: string;
      optionIndex: number;
      correctOptionIndex: number;
    }
  | { type: "nextQuestion" }
  | { type: "reset"; totalQuestions: number };

export function createInitialQuizState(totalQuestions: number): QuizState {
  return {
    totalQuestions,
    currentIndex: 0,
    selectedOptionIndex: null,
    isAnswered: false,
    score: 0,
    status: totalQuestions > 0 ? "playing" : "finished",
    answers: []
  };
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "selectOption": {
      if (state.status === "finished" || state.isAnswered) {
        return state;
      }

      const isCorrect = action.optionIndex === action.correctOptionIndex;

      return {
        ...state,
        selectedOptionIndex: action.optionIndex,
        isAnswered: true,
        score: isCorrect ? state.score + 1 : state.score,
        answers: [
          ...state.answers,
          {
            questionId: action.questionId,
            selectedOptionIndex: action.optionIndex,
            correctOptionIndex: action.correctOptionIndex,
            isCorrect
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
      return createInitialQuizState(action.totalQuestions);
    }

    default: {
      return state;
    }
  }
}
