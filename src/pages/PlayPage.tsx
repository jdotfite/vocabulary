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
import { recordPracticeSession } from "@/lib/practiceStats";
import { useUserProgress, getRecentlySeenWords } from "@/lib/userProgressStore";
import type { ModeQuestion } from "@/types/content";
import type { CompletedQuizPayload } from "@/types/session";

function modeLabelByType(type: string): string {
  if (type === "guess_word") return "Guess the word";
  if (type === "meaning_match") return "Meaning match";
  return "Fill in the gap";
}

function shuffleArray<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = shuffled[i];
    const b = shuffled[j];
    if (a !== undefined && b !== undefined) {
      shuffled[i] = b;
      shuffled[j] = a;
    }
  }
  return shuffled;
}

function shuffleWithDeprioritization(
  questions: readonly ModeQuestion[],
  recentWords: Set<string>
): ModeQuestion[] {
  if (recentWords.size === 0) return shuffleArray(questions);

  const fresh: ModeQuestion[] = [];
  const recent: ModeQuestion[] = [];

  for (const q of questions) {
    if (recentWords.has(q.word)) {
      recent.push(q);
    } else {
      fresh.push(q);
    }
  }

  return [...shuffleArray(fresh), ...shuffleArray(recent)];
}

export function PlayPage(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams();
  const [showLeaveSheet, setShowLeaveSheet] = useState(false);

  const mode = useMemo(() => getModeById(params.modeId ?? ""), [params.modeId]);

  const shuffledQuestions = useMemo(() => {
    if (!mode) return [];
    const recentWords = getRecentlySeenWords(4);
    return shuffleWithDeprioritization(mode.questions, recentWords);
  }, [mode]);

  const [state, dispatch] = useReducer(
    quizReducer,
    shuffledQuestions.length,
    createInitialQuizState
  );

  const recordAnswer = useUserProgress((s) => s.recordAnswer);
  const toggleFavorite = useUserProgress((s) => s.toggleFavorite);
  const toggleBookmark = useUserProgress((s) => s.toggleBookmark);
  const favorites = useUserProgress((s) => s.favorites);
  const bookmarks = useUserProgress((s) => s.bookmarks);

  useEffect(() => {
    if (!mode) {
      navigate("/modes", { replace: true });
      return;
    }
    dispatch({
      type: "reset",
      totalQuestions: shuffledQuestions.length
    });
  }, [mode, navigate, shuffledQuestions.length]);

  if (!mode) {
    return <main className="pt-8">Loading mode…</main>;
  }

  const currentQuestion = shuffledQuestions[state.currentIndex];

  if (!currentQuestion) {
    return (
      <main className="space-y-4 pt-8">
        <p className="text-text-secondary">No questions found for this mode.</p>
      </main>
    );
  }

  const progress = (state.currentIndex + 1) / shuffledQuestions.length;
  const answerStatus =
    state.selectedOptionIndex === currentQuestion.correctOptionIndex ? "correct" : "incorrect";

  const buildOptionState = (optionIndex: number): OptionButtonProps["state"] => {
    if (!state.isAnswered) return "default";
    if (optionIndex === currentQuestion.correctOptionIndex) return "correct";
    if (optionIndex === state.selectedOptionIndex) return "incorrect";
    return "disabled";
  };

  const handleSelectOption = (optionIndex: number): void => {
    if (state.isAnswered) return;

    const isCorrect = optionIndex === currentQuestion.correctOptionIndex;
    dispatch({
      type: "selectOption",
      questionId: currentQuestion.id,
      optionIndex,
      correctOptionIndex: currentQuestion.correctOptionIndex
    });
    recordAnswer(currentQuestion.word, isCorrect);
  };

  const handleNext = (): void => {
    const isLast = state.currentIndex >= shuffledQuestions.length - 1;

    if (isLast) {
      const payload: CompletedQuizPayload = {
        modeId: mode.modeId,
        score: state.score,
        total: shuffledQuestions.length,
        answers: state.answers,
        completedAt: new Date().toISOString()
      };
      recordPracticeSession(payload);
      navigate("/summary", { state: payload });
      return;
    }

    dispatch({ type: "nextQuestion" });
  };

  const isFavorited = favorites.includes(currentQuestion.word);
  const isBookmarked = bookmarks.includes(currentQuestion.word);

  return (
    <main className="space-y-4 pt-2">
      <TopProgressBar onClose={() => setShowLeaveSheet(true)} progress={progress} />

      <PromptCard modeLabel={modeLabelByType(currentQuestion.type)} text={currentQuestion.prompt} />

      <section className="space-y-option-gap pt-2">
        {currentQuestion.options.map((option, optionIndex) => (
          <OptionButton
            key={`${currentQuestion.id}-${option}`}
            label={option}
            onClick={() => handleSelectOption(optionIndex)}
            showCheckIcon={state.isAnswered && optionIndex === currentQuestion.correctOptionIndex}
            state={buildOptionState(optionIndex)}
          />
        ))}
      </section>

      <FeedbackSheet
        definition={currentQuestion.definition}
        isBookmarked={isBookmarked}
        isFavorited={isFavorited}
        onNext={handleNext}
        onToggleBookmark={() => toggleBookmark(currentQuestion.word)}
        onToggleFavorite={() => toggleFavorite(currentQuestion.word)}
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
