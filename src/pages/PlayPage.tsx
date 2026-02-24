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
import {
  getShufflePool,
  getPoolByType,
  getWeakWordsPool,
  getSprintPool,
  getPerfectionPool
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

function usePseudoModeQuestions(modeId: string): ModeQuestion[] | null {
  const vocabularyLevel = useUserProgress((s) => s.vocabularyLevel);
  const ageRange = useUserProgress((s) => s.ageRange);
  const wordStats = useUserProgress((s) => s.wordStats);

  // Freeze wordStats at session start so adaptive pool doesn't recompute mid-quiz
  const [frozenWordStats] = useState(() => wordStats);

  return useMemo(() => {
    if (!PSEUDO_MODES.has(modeId)) return null;

    const prefs = { vocabularyLevel, ageRange };

    if (modeId === "shuffle") return getShufflePool(prefs, frozenWordStats);
    if (modeId === "sprint") return getSprintPool(prefs, frozenWordStats);
    if (modeId === "perfection") return getPerfectionPool(prefs, frozenWordStats);
    if (modeId === "weak_words") return getWeakWordsPool(prefs, frozenWordStats);

    const questionType = TYPE_MAP[modeId];
    if (questionType) return getPoolByType(prefs, questionType, frozenWordStats);

    return getShufflePool(prefs, frozenWordStats);
  }, [modeId, vocabularyLevel, ageRange, frozenWordStats]);
}

export function PlayPage(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams();
  const [showLeaveSheet, setShowLeaveSheet] = useState(false);

  const modeId = params.modeId ?? "";
  const isPseudo = PSEUDO_MODES.has(modeId);
  const mode = useMemo(() => (isPseudo ? null : getModeById(modeId)), [modeId, isPseudo]);
  const pseudoQuestions = usePseudoModeQuestions(modeId);

  // Freeze questions for the session — pool functions shuffle randomly,
  // so useMemo recomputation would produce a different order mid-quiz.
  const [shuffledQuestions] = useState(() => {
    if (isPseudo) return pseudoQuestions ?? [];
    if (!mode) return [];
    const recentWords = getRecentlySeenWords(4);
    return shuffleWithDeprioritization(mode.questions, recentWords);
  });

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
    if (!isPseudo && !mode) {
      navigate("/modes", { replace: true });
    }
  }, [isPseudo, mode, navigate]);

  if (!isPseudo && !mode) {
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
      const effectiveModeId: AnyModeId = isPseudo
        ? (modeId as AnyModeId)
        : (mode?.modeId ?? (modeId as AnyModeId));
      const payload: CompletedQuizPayload = {
        modeId: effectiveModeId,
        score: state.score,
        total: shuffledQuestions.length,
        answers: state.answers,
        completedAt: new Date().toISOString()
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
