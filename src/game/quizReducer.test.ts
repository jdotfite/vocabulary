import { describe, expect, it } from "vitest";

import { createInitialQuizState, quizReducer } from "@/game/quizReducer";

describe("quizReducer", () => {
  it("locks answers after first selection", () => {
    const initial = createInitialQuizState(2);
    const selected = quizReducer(initial, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 1,
      correctOptionIndex: 1
    });
    const secondAttempt = quizReducer(selected, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 0,
      correctOptionIndex: 1
    });

    expect(selected.isAnswered).toBe(true);
    expect(secondAttempt.answers).toHaveLength(1);
    expect(secondAttempt.selectedOptionIndex).toBe(1);
  });

  it("increments score for correct answers only", () => {
    const initial = createInitialQuizState(2);

    const correct = quizReducer(initial, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 2,
      correctOptionIndex: 2
    });

    const afterNext = quizReducer(correct, { type: "nextQuestion" });
    const incorrect = quizReducer(afterNext, {
      type: "selectOption",
      questionId: "q2",
      optionIndex: 0,
      correctOptionIndex: 2
    });

    expect(correct.score).toBe(1);
    expect(incorrect.score).toBe(1);
  });

  it("moves to next question only after answer is selected", () => {
    const initial = createInitialQuizState(2);
    const premature = quizReducer(initial, { type: "nextQuestion" });
    const selected = quizReducer(initial, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 0,
      correctOptionIndex: 0
    });
    const progressed = quizReducer(selected, { type: "nextQuestion" });

    expect(premature.currentIndex).toBe(0);
    expect(progressed.currentIndex).toBe(1);
    expect(progressed.isAnswered).toBe(false);
    expect(progressed.selectedOptionIndex).toBeNull();
  });

  it("marks quiz as finished after last answered question", () => {
    const initial = createInitialQuizState(1);
    const answered = quizReducer(initial, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 0,
      correctOptionIndex: 0
    });
    const finished = quizReducer(answered, { type: "nextQuestion" });

    expect(finished.status).toBe("finished");
    expect(finished.score).toBe(1);
    expect(finished.answers).toHaveLength(1);
  });
});
