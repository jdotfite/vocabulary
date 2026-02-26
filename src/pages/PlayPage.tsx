import { useEffect, useMemo, useReducer, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AnimatedQuizCard } from "@/design-system/components/AnimatedQuizCard";
import { FeedbackSheet } from "@/design-system/components/FeedbackSheet";
import { LeaveConfirmSheet } from "@/design-system/components/LeaveConfirmSheet";
import { OptionButton } from "@/design-system/components/OptionButton";
import type { OptionButtonProps } from "@/design-system/components/OptionButton";
import { PromptCard } from "@/design-system/components/PromptCard";
import { TopProgressBar } from "@/design-system/components/TopProgressBar";
import { quizReducer, createInitialQuizState } from "@/game/quizReducer";
import { getModeById } from "@/lib/modes";
import { recordPracticeSession } from "@/lib/practiceStats";
import {
  getShufflePool,
  getPoolByType,
  getWeakWordsPool,
  getAdaptivePool,
} from "@/lib/questionPool";
import { useUserProgress, getRecentlySeenWords } from "@/lib/userProgressStore";
import type { AnyModeId, ModeQuestion, QuestionType } from "@/types/content";
import type { CompletedQuizPayload } from "@/types/session";

const PSEUDO_MODES = new Set([
  "shuffle",
  "guess_word",
  "meaning_match",
  "fill_gap",
  "weak_words",
  "sprint",
  "perfection"
]);

const TYPE_MAP: Record<string, QuestionType> = {
  guess_word: "guess_word",
  meaning_match: "meaning_match",
  fill_gap: "fill_gap"
};

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
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ModeQuestion[]>([]);

  const modeId = params.modeId ?? "";
  const isPseudo = PSEUDO_MODES.has(modeId);
  const mode = useMemo(() => (isPseudo ? null : getModeById(modeId)), [modeId, isPseudo]);

  const vocabularyLevel = useUserProgress((s) => s.vocabularyLevel);
  const ageRange = useUserProgress((s) => s.ageRange);
  const wordStats = useUserProgress((s) => s.wordStats);
  const [frozenWordStats] = useState(() => wordStats);
  const recordAnswer = useUserProgress((s) => s.recordAnswer);
  const toggleFavorite = useUserProgress((s) => s.toggleFavorite);
  const toggleBookmark = useUserProgress((s) => s.toggleBookmark);
  const favorites = useUserProgress((s) => s.favorites);
  const bookmarks = useUserProgress((s) => s.bookmarks);
  const abilityScore = useUserProgress((s) => s.abilityScore);
  const [startAbility] = useState(() => abilityScore);

  const [state, dispatch] = useReducer(quizReducer, 0, createInitialQuizState);

  // Load questions from adaptive API on mount
  useEffect(() => {
    const prefs = { vocabularyLevel, ageRange };

    const localFallback = (): ModeQuestion[] => {
      if (isPseudo) {
        if (modeId === "shuffle") return getShufflePool(prefs, frozenWordStats);
        if (modeId === "weak_words") return getWeakWordsPool(prefs, frozenWordStats);
        const questionType = TYPE_MAP[modeId];
        if (questionType) return getPoolByType(prefs, questionType, frozenWordStats);
        return getShufflePool(prefs, frozenWordStats);
      }
      if (!mode) return [];
      const recentWords = getRecentlySeenWords(4);
      return shuffleWithDeprioritization(mode.questions, recentWords);
    };

    void getAdaptivePool(modeId as AnyModeId, localFallback).then((qs) => {
      setQuestions(qs);
      dispatch({ type: "reset", totalQuestions: qs.length });
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  useEffect(() => {
    if (!loading && !isPseudo && !mode) {
      navigate("/modes", { replace: true });
    }
  }, [loading, isPseudo, mode, navigate]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">Loading questions...</p>
      </main>
    );
  }

  const currentQuestion = questions[state.currentIndex];

  if (!currentQuestion) {
    return (
      <main className="space-y-4 pt-8">
        <p className="text-text-secondary">No questions found for this mode.</p>
      </main>
    );
  }

  const progress = (state.currentIndex + 1) / questions.length;
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
      wordId: currentQuestion.wordId,
      questionType: currentQuestion.type,
      optionIndex,
      correctOptionIndex: currentQuestion.correctOptionIndex
    });
    recordAnswer(currentQuestion.word, isCorrect);
  };

  const handleNext = (): void => {
    const isLast = state.currentIndex >= questions.length - 1;

    if (isLast) {
      const effectiveModeId: AnyModeId = isPseudo
        ? (modeId as AnyModeId)
        : (mode?.modeId ?? (modeId as AnyModeId));
      const payload: CompletedQuizPayload = {
        modeId: effectiveModeId,
        score: state.score,
        total: questions.length,
        answers: state.answers,
        completedAt: new Date().toISOString(),
        abilityBefore: startAbility,
      };
      void recordPracticeSession(payload)
        .catch(() => undefined)
        .finally(() => navigate("/summary", { state: payload }));
      return;
    }

    dispatch({ type: "nextQuestion" });
  };

  const isFavorited = favorites.includes(currentQuestion.word);
  const isBookmarked = bookmarks.includes(currentQuestion.word);

  return (
    <main className="space-y-4 pt-2">
      <TopProgressBar onClose={() => setShowLeaveSheet(true)} progress={progress} />

      <AnimatedQuizCard questionKey={currentQuestion.id}>
        <PromptCard
          modeLabel={modeLabelByType(currentQuestion.type)}
          questionId={currentQuestion.id}
          text={currentQuestion.prompt}
        />

        <section className="space-y-option-gap pt-2">
          {currentQuestion.options.map((option, optionIndex) => (
            <OptionButton
              key={`${currentQuestion.id}-${option}`}
              label={option}
              motionIndex={optionIndex}
              onClick={() => handleSelectOption(optionIndex)}
              showCheckIcon={state.isAnswered && optionIndex === currentQuestion.correctOptionIndex}
              state={buildOptionState(optionIndex)}
            />
          ))}
        </section>
      </AnimatedQuizCard>

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
