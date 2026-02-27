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

  it("decrements lives on wrong answer when lives are finite", () => {
    const initial = createInitialQuizState(5, "perfection", 3);
    expect(initial.lives).toBe(3);
    expect(initial.maxLives).toBe(3);

    const wrong = quizReducer(initial, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 0,
      correctOptionIndex: 1
    });

    expect(wrong.lives).toBe(2);
    expect(wrong.status).toBe("playing");
  });

  it("finishes game when lives reach 0", () => {
    const initial = createInitialQuizState(5, "rush", 1);

    const wrong = quizReducer(initial, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 0,
      correctOptionIndex: 1
    });

    expect(wrong.lives).toBe(0);
    expect(wrong.status).toBe("finished");
  });

  it("does not decrement lives on correct answer", () => {
    const initial = createInitialQuizState(5, "rush", 3);

    const correct = quizReducer(initial, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 1,
      correctOptionIndex: 1
    });

    expect(correct.lives).toBe(3);
  });

  it("perfection stays playing when lives reach 0 (feedback sheet handles exit)", () => {
    const initial = createInitialQuizState(5, "perfection", 1);

    const wrong = quizReducer(initial, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 0,
      correctOptionIndex: 1
    });

    expect(wrong.lives).toBe(0);
    expect(wrong.status).toBe("playing");

    // failPerfection then ends the game
    const finished = quizReducer(wrong, { type: "failPerfection" });
    expect(finished.status).toBe("finished");
  });

  it("rushReshuffle resets index but preserves score and lives", () => {
    let state = createInitialQuizState(2, "rush", 3);
    state = quizReducer(state, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 1,
      correctOptionIndex: 1
    });
    state = quizReducer(state, { type: "nextQuestion" });
    state = quizReducer(state, {
      type: "selectOption",
      questionId: "q2",
      optionIndex: 0,
      correctOptionIndex: 1
    });

    const reshuffled = quizReducer(state, {
      type: "rushReshuffle",
      totalQuestions: 5
    });

    expect(reshuffled.currentIndex).toBe(0);
    expect(reshuffled.totalQuestions).toBe(5);
    expect(reshuffled.score).toBe(1);
    expect(reshuffled.lives).toBe(2);
    expect(reshuffled.isAnswered).toBe(false);
  });

  it("perfectionReshuffle resets index but preserves score and lives", () => {
    let state = createInitialQuizState(2, "perfection", 3);
    state = quizReducer(state, {
      type: "selectOption",
      questionId: "q1",
      optionIndex: 1,
      correctOptionIndex: 1
    });
    state = quizReducer(state, { type: "nextQuestion" });
    state = quizReducer(state, {
      type: "selectOption",
      questionId: "q2",
      optionIndex: 1,
      correctOptionIndex: 1
    });

    const reshuffled = quizReducer(state, {
      type: "perfectionReshuffle",
      totalQuestions: 8
    });

    expect(reshuffled.currentIndex).toBe(0);
    expect(reshuffled.totalQuestions).toBe(8);
    expect(reshuffled.score).toBe(2);
    expect(reshuffled.lives).toBe(3);
    expect(reshuffled.isAnswered).toBe(false);
    expect(reshuffled.answers).toHaveLength(2);
  });

  it("perfectionReshuffle is ignored for non-perfection modes", () => {
    const state = createInitialQuizState(5, "rush", 3);
    const result = quizReducer(state, {
      type: "perfectionReshuffle",
      totalQuestions: 8
    });
    expect(result).toBe(state);
  });
});
