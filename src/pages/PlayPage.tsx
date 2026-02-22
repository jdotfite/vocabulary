import { useEffect, useMemo, useReducer, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { FeedbackSheet } from "@/design-system/components/FeedbackSheet";
import { LeaveConfirmSheet } from "@/design-system/components/LeaveConfirmSheet";
import { OptionButton } from "@/design-system/components/OptionButton";
import type { OptionButtonProps } from "@/design-system/components/OptionButton";
import { PromptCard } from "@/design-system/components/PromptCard";
import { TopProgressBar } from "@/design-system/components/TopProgressBar";
import { quizReducer, createInitialQuizState } from "@/game/quizReducer";
import { getModeById } from "@/lib/modes";
import type { CompletedQuizPayload } from "@/types/session";

function modeLabelByType(type: string): string {
  if (type === "guess_word") return "Guess the word";
  if (type === "meaning_match") return "Meaning match";
  return "Fill in the gap";
}

export function PlayPage(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams();
  const [showLeaveSheet, setShowLeaveSheet] = useState(false);

  const mode = useMemo(() => getModeById(params.modeId ?? ""), [params.modeId]);
  const [state, dispatch] = useReducer(
    quizReducer,
    mode?.questions.length ?? 0,
    createInitialQuizState
  );

  useEffect(() => {
    if (!mode) {
      navigate("/modes", { replace: true });
      return;
    }
    dispatch({
      type: "reset",
      totalQuestions: mode.questions.length
    });
  }, [mode, navigate]);

  if (!mode) {
    return <main className="pt-8">Loading mode…</main>;
  }

  const currentQuestion = mode.questions[state.currentIndex];

  if (!currentQuestion) {
    return (
      <main className="space-y-4 pt-8">
        <p className="text-text-secondary">No questions found for this mode.</p>
      </main>
    );
  }

  const progress = (state.currentIndex + 1) / mode.questions.length;
  const answerStatus =
    state.selectedOptionIndex === currentQuestion.correctOptionIndex ? "correct" : "incorrect";

  const buildOptionState = (optionIndex: number): OptionButtonProps["state"] => {
    if (!state.isAnswered) return "default";
    if (optionIndex === currentQuestion.correctOptionIndex) return "correct";
    if (optionIndex === state.selectedOptionIndex) return "incorrect";
    return "disabled";
  };

  const handleNext = (): void => {
    const isLast = state.currentIndex >= mode.questions.length - 1;

    if (isLast) {
      const payload: CompletedQuizPayload = {
        modeId: mode.modeId,
        score: state.score,
        total: mode.questions.length,
        answers: state.answers,
        completedAt: new Date().toISOString()
      };
      navigate("/summary", { state: payload });
      return;
    }

    dispatch({ type: "nextQuestion" });
  };

  return (
    <main className="space-y-4 pt-2">
      <TopProgressBar onClose={() => setShowLeaveSheet(true)} progress={progress} />

      <PromptCard modeLabel={modeLabelByType(currentQuestion.type)} text={currentQuestion.prompt} />

      <section className="space-y-option-gap pt-2">
        {currentQuestion.options.map((option, optionIndex) => (
          <OptionButton
            key={`${currentQuestion.id}-${option}`}
            label={option}
            onClick={() =>
              dispatch({
                type: "selectOption",
                questionId: currentQuestion.id,
                optionIndex,
                correctOptionIndex: currentQuestion.correctOptionIndex
              })
            }
            showCheckIcon={state.isAnswered && optionIndex === currentQuestion.correctOptionIndex}
            state={buildOptionState(optionIndex)}
          />
        ))}
      </section>

      <FeedbackSheet
        definition={currentQuestion.definition}
        onNext={handleNext}
        open={state.isAnswered}
        phonetic={currentQuestion.phonetic}
        sentence={currentQuestion.sentence}
        status={answerStatus}
        word={currentQuestion.word}
      />

      <LeaveConfirmSheet
        onClose={() => setShowLeaveSheet(false)}
        onLeave={() => navigate("/modes")}
        onStay={() => setShowLeaveSheet(false)}
        open={showLeaveSheet}
      />
    </main>
  );
}
