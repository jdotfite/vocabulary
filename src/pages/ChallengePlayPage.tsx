import clsx from "clsx";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { FeedbackSheet } from "@/design-system/components/FeedbackSheet";
import { LeaveConfirmSheet } from "@/design-system/components/LeaveConfirmSheet";
import { OptionButton } from "@/design-system/components/OptionButton";
import type { OptionButtonProps } from "@/design-system/components/OptionButton";
import { PromptCard } from "@/design-system/components/PromptCard";
import { TimerBar } from "@/design-system/components/TimerBar";
import { TopProgressBar } from "@/design-system/components/TopProgressBar";
import {
  quizReducer,
  createInitialQuizState
} from "@/game/quizReducer";
import type { ChallengeMode } from "@/game/quizReducer";
import { recordPracticeSession } from "@/lib/practiceStats";
import { getSprintPool, getPerfectionPool } from "@/lib/questionPool";
import { useUserProgress } from "@/lib/userProgressStore";
import type { AnyModeId, ModeQuestion } from "@/types/content";
import type { CompletedQuizPayload } from "@/types/session";

const SPRINT_DURATION_MS = 90_000;
const FLASH_DURATION_MS = 800;

function modeLabelByType(type: string): string {
  if (type === "guess_word") return "Guess the word";
  if (type === "meaning_match") return "Meaning match";
  return "Fill in the gap";
}

const VALID_CHALLENGE_TYPES = new Set<string>(["sprint", "perfection"]);

export function ChallengePlayPage(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams();
  const rawType = params.challengeType ?? "";
  const isValidType = VALID_CHALLENGE_TYPES.has(rawType);
  const challengeType = isValidType ? (rawType as "sprint" | "perfection") : "sprint";
  const isSprint = challengeType === "sprint";
  const challengeMode: ChallengeMode = isSprint ? "sprint" : "perfection";

  const vocabularyLevel = useUserProgress((s) => s.vocabularyLevel);
  const ageRange = useUserProgress((s) => s.ageRange);
  const wordStats = useUserProgress((s) => s.wordStats);
  const recordAnswer = useUserProgress((s) => s.recordAnswer);
  const toggleFavorite = useUserProgress((s) => s.toggleFavorite);
  const toggleBookmark = useUserProgress((s) => s.toggleBookmark);
  const favorites = useUserProgress((s) => s.favorites);
  const bookmarks = useUserProgress((s) => s.bookmarks);

  const prefs = useMemo(
    () => ({ vocabularyLevel, ageRange }),
    [vocabularyLevel, ageRange]
  );

  const questions = useMemo<ModeQuestion[]>(
    () => (isSprint ? getSprintPool(prefs, wordStats) : getPerfectionPool(prefs, wordStats)),
    [isSprint, prefs, wordStats]
  );

  const [state, dispatch] = useReducer(
    quizReducer,
    { total: questions.length, mode: challengeMode },
    (arg) => createInitialQuizState(arg.total, arg.mode)
  );

  const [showLeaveSheet, setShowLeaveSheet] = useState(false);

  // Sprint timer
  const [remainingMs, setRemainingMs] = useState(SPRINT_DURATION_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isSprint || state.status === "finished") return;

    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = SPRINT_DURATION_MS - elapsed;
      if (remaining <= 0) {
        setRemainingMs(0);
        dispatch({ type: "timeUp" });
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setRemainingMs(remaining);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSprint, state.status]);

  // Sprint: flash feedback then auto-advance
  const [flashState, setFlashState] = useState<"correct" | "incorrect" | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // For sprint reshuffle when all answered
  const [questionPool, setQuestionPool] = useState(questions);
  const currentQuestion: ModeQuestion | undefined = questionPool[state.currentIndex];

  const finishGame = useCallback(() => {
    const modeId: AnyModeId = isSprint ? "sprint" : "perfection";
    const payload: CompletedQuizPayload = {
      modeId,
      score: state.score,
      total: state.answers.length,
      answers: state.answers,
      completedAt: new Date().toISOString()
    };
    void recordPracticeSession(payload)
      .catch(() => undefined)
      .finally(() => navigate("/summary", { state: payload }));
  }, [isSprint, state.score, state.answers, navigate]);

  // Navigate when finished
  useEffect(() => {
    if (state.status !== "finished") return;

    if (state.answers.length === 0) {
      // No answers (e.g. timer expired before first answer) — go home
      navigate("/modes", { replace: true });
      return;
    }

    finishGame();
  }, [state.status, state.answers.length, finishGame, navigate]);

  // Redirect invalid challenge types
  if (!isValidType) {
    return <Navigate replace to="/modes" />;
  }

  if (!currentQuestion) {
    return (
      <main className="space-y-4 pt-8">
        <p className="text-text-secondary">No questions available.</p>
      </main>
    );
  }

  const buildOptionState = (optionIndex: number): OptionButtonProps["state"] => {
    if (isSprint) {
      if (!flashState) return "default";
      if (optionIndex === currentQuestion.correctOptionIndex) return "correct";
      if (optionIndex === state.selectedOptionIndex) return "incorrect";
      return "disabled";
    }
    if (!state.isAnswered) return "default";
    if (optionIndex === currentQuestion.correctOptionIndex) return "correct";
    if (optionIndex === state.selectedOptionIndex) return "incorrect";
    return "disabled";
  };

  const handleSelectOption = (optionIndex: number): void => {
    if (state.isAnswered || flashState) return;

    const isCorrect = optionIndex === currentQuestion.correctOptionIndex;
    dispatch({
      type: "selectOption",
      questionId: currentQuestion.id,
      optionIndex,
      correctOptionIndex: currentQuestion.correctOptionIndex
    });
    recordAnswer(currentQuestion.word, isCorrect);

    if (isSprint) {
      // Flash green/red then auto-advance
      setFlashState(isCorrect ? "correct" : "incorrect");
      flashTimeoutRef.current = setTimeout(() => {
        setFlashState(null);

        const isLast = state.currentIndex >= questionPool.length - 1;
        if (isLast) {
          // Reshuffle and continue — score + answers are preserved
          const newPool = getSprintPool(prefs, wordStats);
          setQuestionPool(newPool);
          dispatch({
            type: "sprintReshuffle",
            totalQuestions: newPool.length
          });
        } else {
          dispatch({ type: "nextQuestion" });
        }
      }, FLASH_DURATION_MS);
    } else if (!isCorrect) {
      // Perfection: first wrong answer ends the game
      // Show feedback sheet with game over, then failPerfection on "next"
    }
  };

  const handleNext = (): void => {
    if (challengeMode === "perfection") {
      const lastAnswer = state.answers[state.answers.length - 1];
      if (lastAnswer && !lastAnswer.isCorrect) {
        dispatch({ type: "failPerfection" });
        return;
      }
    }

    const isLast = state.currentIndex >= questionPool.length - 1;
    if (isLast) {
      dispatch({ type: "failPerfection" }); // end for perfection
      return;
    }

    dispatch({ type: "nextQuestion" });
  };

  const progress = (state.currentIndex + 1) / questionPool.length;
  const answerStatus =
    state.selectedOptionIndex === currentQuestion.correctOptionIndex
      ? "correct"
      : "incorrect";

  const isFavorited = favorites.includes(currentQuestion.word);
  const isBookmarked = bookmarks.includes(currentQuestion.word);

  // Perfection: show feedback sheet with game over text on wrong answer
  const lastAnswer = state.answers[state.answers.length - 1];
  const isPerfectionGameOver =
    challengeMode === "perfection" &&
    state.isAnswered &&
    lastAnswer &&
    !lastAnswer.isCorrect;

  return (
    <main className="space-y-4 pt-2">
      {isSprint ? (
        <TimerBar
          onClose={() => setShowLeaveSheet(true)}
          remainingMs={remainingMs}
          totalMs={SPRINT_DURATION_MS}
        />
      ) : (
        <div className="flex items-center gap-3">
          <TopProgressBar
            onClose={() => setShowLeaveSheet(true)}
            progress={progress}
          />
          {challengeMode === "perfection" && (
            <span className="text-lg" title="1 life — no mistakes allowed">
              ❤️
            </span>
          )}
        </div>
      )}

      <PromptCard
        modeLabel={modeLabelByType(currentQuestion.type)}
        text={currentQuestion.prompt}
      />

      <section className="space-y-option-gap pt-2">
        {currentQuestion.options.map((option, optionIndex) => (
          <OptionButton
            key={`${currentQuestion.id}-${option}`}
            label={option}
            onClick={() => handleSelectOption(optionIndex)}
            showCheckIcon={
              (state.isAnswered || flashState !== null) &&
              optionIndex === currentQuestion.correctOptionIndex
            }
            state={buildOptionState(optionIndex)}
          />
        ))}
      </section>

      {/* Sprint: colored border flash */}
      {isSprint && flashState && (
        <div
          className={clsx(
            "pointer-events-none fixed inset-0 rounded-card border-4",
            flashState === "correct"
              ? "border-state-correct"
              : "border-state-incorrect"
          )}
        />
      )}

      {/* Perfection: show FeedbackSheet */}
      {!isSprint && state.isAnswered && (
        <FeedbackSheet
          definition={currentQuestion.definition}
          isBookmarked={isBookmarked}
          isFavorited={isFavorited}
          onNext={handleNext}
          onToggleBookmark={() => toggleBookmark(currentQuestion.word)}
          onToggleFavorite={() => toggleFavorite(currentQuestion.word)}
          open={state.isAnswered}
          phonetic={currentQuestion.phonetic}
          sentence={
            isPerfectionGameOver
              ? `Game over! You got ${state.score} correct.`
              : currentQuestion.sentence
          }
          status={answerStatus}
          word={currentQuestion.word}
        />
      )}

      <LeaveConfirmSheet
        onClose={() => setShowLeaveSheet(false)}
        onLeave={() => navigate("/modes")}
        onStay={() => setShowLeaveSheet(false)}
        open={showLeaveSheet}
      />
    </main>
  );
}
