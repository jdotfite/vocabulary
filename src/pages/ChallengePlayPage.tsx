import clsx from "clsx";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { AnimatedQuizCard } from "@/design-system/components/AnimatedQuizCard";
import { FeedbackSheet } from "@/design-system/components/FeedbackSheet";
import { LeaveConfirmSheet } from "@/design-system/components/LeaveConfirmSheet";
import { ModeSplash } from "@/design-system/components/ModeSplash";
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
import { CHALLENGE_CONFIGS } from "@/lib/challengeConfig";
import { recordPracticeSession } from "@/lib/practiceStats";
import { getSprintPool, getPerfectionPool, getRushPool, getLevelTestPool, getAdaptivePool } from "@/lib/questionPool";
import { useUserProgress } from "@/lib/userProgressStore";
import type { AnyModeId, ModeQuestion } from "@/types/content";
import type { CompletedQuizPayload } from "@/types/session";

const SPRINT_DURATION_MS = 60_000;
const RUSH_PER_QUESTION_MS = 5_000;
const FLASH_DURATION_MS = 800;

type ValidChallengeType = "sprint" | "perfection" | "rush" | "level_test";

function modeLabelByType(type: string): string {
  if (type === "guess_word") return "Guess the word";
  if (type === "meaning_match") return "Meaning match";
  return "Fill in the gap";
}

const VALID_CHALLENGE_TYPES = new Set<string>(["sprint", "perfection", "rush", "level_test"]);

function getChallengeMode(type: ValidChallengeType): ChallengeMode {
  if (type === "sprint") return "sprint";
  if (type === "rush") return "rush";
  if (type === "perfection") return "perfection";
  return "standard"; // level_test uses standard mode
}

function getLivesForType(type: ValidChallengeType): number {
  if (type === "perfection" || type === "rush") return 3;
  return Infinity;
}

function HeartsDisplay({ lives, maxLives }: { lives: number; maxLives: number }): JSX.Element {
  const hearts: JSX.Element[] = [];
  for (let i = 0; i < maxLives; i++) {
    hearts.push(
      <span className="text-sm" key={i}>
        {i < lives ? "\u2764\uFE0F" : "\u{1F90D}"}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-bg-surface px-2.5 py-1.5">
      {hearts}
    </div>
  );
}

function ScorePill({ score }: { score: number }): JSX.Element {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-bg-surface px-2.5 py-1.5">
      <svg
        aria-hidden
        fill="none"
        height="14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 24 24"
        width="14"
      >
        <rect height="14" rx="2" width="14" x="2" y="8" />
        <path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
      </svg>
      <span className="text-sm font-bold text-text-primary">{score}</span>
    </div>
  );
}

export function ChallengePlayPage(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams();
  const rawType = params.challengeType ?? "";
  const isValidType = VALID_CHALLENGE_TYPES.has(rawType);
  const challengeType = isValidType ? (rawType as ValidChallengeType) : "sprint";
  const challengeMode = getChallengeMode(challengeType);
  const isSprint = challengeType === "sprint";
  const isRush = challengeType === "rush";
  const isPerfection = challengeType === "perfection";
  const isLevelTest = challengeType === "level_test";
  const usesFlash = isSprint || isRush;
  const initialLives = getLivesForType(challengeType);

  // Splash state (per-mode dismissal)
  const splashDismissed = useUserProgress((s) => s.splashDismissed);
  const setSplashDismissed = useUserProgress((s) => s.setSplashDismissed);
  const isModeDissmissed = splashDismissed.includes(challengeType);
  const [showSplash, setShowSplash] = useState(!isModeDissmissed);
  const [localDismissToggle, setLocalDismissToggle] = useState(false);

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
  const [loading, setLoading] = useState(true);

  const prefs = useMemo(
    () => ({ vocabularyLevel, ageRange }),
    [vocabularyLevel, ageRange]
  );

  const [questions, setQuestionsState] = useState<ModeQuestion[]>([]);

  const [state, dispatch] = useReducer(
    quizReducer,
    { total: 0, mode: challengeMode, lives: initialLives },
    (arg) => createInitialQuizState(arg.total, arg.mode, arg.lives)
  );

  // Load questions from adaptive API on mount
  useEffect(() => {
    const localFallback = (): ModeQuestion[] => {
      if (isLevelTest) return getLevelTestPool();
      if (isRush) return getRushPool(prefs, frozenWordStats);
      if (isPerfection) return getPerfectionPool(prefs, frozenWordStats);
      return getSprintPool(prefs, frozenWordStats);
    };

    void getAdaptivePool(challengeType, localFallback).then((qs) => {
      setQuestionsState(qs);
      dispatch({
        type: "reset",
        totalQuestions: qs.length,
        challengeMode,
        lives: initialLives,
      });
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const [showLeaveSheet, setShowLeaveSheet] = useState(false);

  // Sprint global timer
  const [remainingMs, setRemainingMs] = useState(SPRINT_DURATION_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isSprint || state.status === "finished" || showSplash) return;

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
  }, [isSprint, state.status, showSplash]);

  // Rush per-question timer
  const [rushRemainingMs, setRushRemainingMs] = useState(RUSH_PER_QUESTION_MS);
  const rushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRushTimer = useCallback(() => {
    if (rushTimerRef.current) {
      clearInterval(rushTimerRef.current);
      rushTimerRef.current = null;
    }
  }, []);

  const startRushTimer = useCallback(() => {
    clearRushTimer();
    setRushRemainingMs(RUSH_PER_QUESTION_MS);
    const start = Date.now();
    rushTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = RUSH_PER_QUESTION_MS - elapsed;
      if (remaining <= 0) {
        setRushRemainingMs(0);
        clearRushTimer();
      } else {
        setRushRemainingMs(remaining);
      }
    }, 50);
  }, [clearRushTimer]);

  // Rush: start timer on each new question (when not on splash)
  useEffect(() => {
    if (!isRush || state.status === "finished" || showSplash || state.isAnswered) return;
    startRushTimer();
    return clearRushTimer;
  }, [isRush, state.status, showSplash, state.currentIndex, state.isAnswered, startRushTimer, clearRushTimer]);

  // Flash feedback for sprint/rush
  const [flashState, setFlashState] = useState<"correct" | "incorrect" | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (state.status === "finished" && flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }
  }, [state.status]);

  // Question pool for reshuffle modes (sprint/rush)
  const [questionPool, setQuestionPool] = useState<ModeQuestion[]>([]);
  // Sync questionPool with loaded questions
  useEffect(() => {
    if (questions.length > 0 && questionPool.length === 0) {
      setQuestionPool(questions);
    }
  }, [questions, questionPool.length]);
  const currentQuestion: ModeQuestion | undefined = questionPool[state.currentIndex];

  // Rush: handle timer expiry as wrong answer
  const rushTimerExpiredRef = useRef(false);
  useEffect(() => {
    if (!isRush || rushRemainingMs > 0 || state.isAnswered || state.status === "finished" || flashState) return;
    if (rushTimerExpiredRef.current) return;
    rushTimerExpiredRef.current = true;

    // Treat as wrong answer — record in answers + lose a life
    if (currentQuestion) {
      dispatch({
        type: "selectOption",
        questionId: currentQuestion.id,
        wordId: currentQuestion.wordId,
        questionType: currentQuestion.type,
        optionIndex: -1,
        correctOptionIndex: currentQuestion.correctOptionIndex
      });
      recordAnswer(currentQuestion.word, false);
    }

    setFlashState("incorrect");
    flashTimeoutRef.current = setTimeout(() => {
      setFlashState(null);
      rushTimerExpiredRef.current = false;

      // Advance — reducer no-ops if already finished
      const isLast = state.currentIndex >= questionPool.length - 1;
      if (isLast) {
        const fallback = (): ModeQuestion[] => getRushPool(prefs, frozenWordStats);
        void getAdaptivePool("rush" as AnyModeId, fallback, 10).then((newPool) => {
          setQuestionPool(newPool);
          dispatch({ type: "rushReshuffle", totalQuestions: newPool.length });
        });
      } else {
        dispatch({ type: "nextQuestion" });
      }
    }, FLASH_DURATION_MS);
  }, [isRush, rushRemainingMs, state.isAnswered, state.status, state.currentIndex, questionPool.length, flashState, currentQuestion, recordAnswer, prefs, frozenWordStats]);

  // Reset rush timer expired flag on question change
  useEffect(() => {
    rushTimerExpiredRef.current = false;
  }, [state.currentIndex]);

  const finishGame = useCallback(() => {
    const modeIdMap: Record<ValidChallengeType, AnyModeId> = {
      sprint: "sprint",
      perfection: "perfection",
      rush: "rush",
      level_test: "level_test"
    };
    const modeId = modeIdMap[challengeType];
    const payload: CompletedQuizPayload = {
      modeId,
      score: state.score,
      total: state.answers.length,
      answers: state.answers,
      completedAt: new Date().toISOString(),
      abilityBefore: startAbility,
    };

    const destination = isLevelTest ? "/level" : "/summary";

    void recordPracticeSession(payload)
      .catch(() => undefined)
      .finally(() => navigate(destination, { state: payload }));
  }, [challengeType, isLevelTest, state.score, state.answers, navigate, startAbility]);

  // Navigate when finished
  useEffect(() => {
    if (state.status !== "finished") return;

    if (state.answers.length === 0) {
      navigate("/modes", { replace: true });
      return;
    }

    finishGame();
  }, [state.status, state.answers.length, finishGame, navigate]);

  // Redirect invalid challenge types
  if (!isValidType) {
    return <Navigate replace to="/modes" />;
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">Loading questions...</p>
      </main>
    );
  }

  // Splash screen
  if (showSplash) {
    const config = CHALLENGE_CONFIGS[challengeType];
    if (config) {
      return (
        <ModeSplash
          dismissed={localDismissToggle}
          onClose={() => navigate("/modes")}
          onStart={() => {
            if (localDismissToggle && !isModeDissmissed) {
              setSplashDismissed(challengeType);
            }
            setShowSplash(false);
          }}
          onToggleDismiss={() => setLocalDismissToggle((v) => !v)}
          placeholderColor={config.accentColor}
          rules={config.rules}
          title={config.title}
        />
      );
    }
  }

  if (!currentQuestion) {
    return (
      <main className="space-y-4 pt-8">
        <p className="text-text-secondary">No questions available.</p>
      </main>
    );
  }

  const buildOptionState = (optionIndex: number): OptionButtonProps["state"] => {
    if (usesFlash) {
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
      wordId: currentQuestion.wordId,
      questionType: currentQuestion.type,
      optionIndex,
      correctOptionIndex: currentQuestion.correctOptionIndex
    });
    recordAnswer(currentQuestion.word, isCorrect);

    if (usesFlash) {
      clearRushTimer();
      // Flash green/red then auto-advance
      setFlashState(isCorrect ? "correct" : "incorrect");
      flashTimeoutRef.current = setTimeout(() => {
        setFlashState(null);

        // Advance — reducer no-ops if already finished
        const isLast = state.currentIndex >= questionPool.length - 1;
        if (isLast) {
          if (isSprint) {
            const fallback = (): ModeQuestion[] => getSprintPool(prefs, frozenWordStats);
            void getAdaptivePool("sprint" as AnyModeId, fallback, 10).then((newPool) => {
              setQuestionPool(newPool);
              dispatch({ type: "sprintReshuffle", totalQuestions: newPool.length });
            });
          } else if (isRush) {
            const fallback = (): ModeQuestion[] => getRushPool(prefs, frozenWordStats);
            void getAdaptivePool("rush" as AnyModeId, fallback, 10).then((newPool) => {
              setQuestionPool(newPool);
              dispatch({ type: "rushReshuffle", totalQuestions: newPool.length });
            });
          }
        } else {
          dispatch({ type: "nextQuestion" });
        }
      }, FLASH_DURATION_MS);
    } else if (isPerfection && !isCorrect) {
      // Perfection: wrong answer loses a life — game over handled by FeedbackSheet next
    }
  };

  const handleNext = (): void => {
    // For perfection: if all lives lost, end the game
    if (isPerfection && state.lives <= 0) {
      dispatch({ type: "failPerfection" });
      return;
    }

    // For perfection: if a wrong answer was given but lives remain, continue
    const isLast = state.currentIndex >= questionPool.length - 1;
    if (isLast) {
      dispatch({ type: "failPerfection" });
      return;
    }

    dispatch({ type: "nextQuestion" });
  };

  const handleLevelTestNext = (): void => {
    dispatch({ type: "nextQuestion" });
  };

  const progress = (state.currentIndex + 1) / questionPool.length;
  const answerStatus =
    state.selectedOptionIndex === currentQuestion.correctOptionIndex
      ? "correct"
      : "incorrect";

  const isFavorited = favorites.includes(currentQuestion.word);
  const isBookmarked = bookmarks.includes(currentQuestion.word);

  // Perfection: game over when answered wrong and all lives gone
  const lastAnswer = state.answers[state.answers.length - 1];
  const isPerfectionGameOver =
    isPerfection && state.isAnswered && lastAnswer && !lastAnswer.isCorrect && state.lives <= 0;

  // Rush timer fraction for the per-question timer bar
  const rushFraction = Math.max(0, Math.min(1, rushRemainingMs / RUSH_PER_QUESTION_MS));

  return (
    <main className="space-y-4 pt-2">
      {/* Sprint: global timer bar */}
      {isSprint && (
        <TimerBar
          onClose={() => setShowLeaveSheet(true)}
          remainingMs={remainingMs}
          totalMs={SPRINT_DURATION_MS}
        />
      )}

      {/* Rush: per-question timer + hearts */}
      {isRush && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              aria-label="Leave quiz"
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright"
              onClick={() => setShowLeaveSheet(true)}
              type="button"
            >
              <svg
                aria-hidden
                fill="none"
                height="22"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
                width="22"
              >
                <path d="m6 6 12 12" />
                <path d="m18 6-12 12" />
              </svg>
            </button>
            <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-bg-surface">
              <div
                className={clsx(
                  "absolute inset-y-0 left-0 rounded-full transition-all duration-100",
                  rushRemainingMs <= 1500
                    ? "bg-state-incorrect"
                    : rushRemainingMs <= 3000
                      ? "bg-state-warning"
                      : "bg-accent-teal"
                )}
                style={{ width: `${rushFraction * 100}%` }}
              />
            </div>
            <span
              className={clsx(
                "min-w-[2rem] text-right text-sm font-bold tabular-nums",
                rushRemainingMs <= 1500
                  ? "text-state-incorrect"
                  : rushRemainingMs <= 3000
                    ? "text-state-warning"
                    : "text-text-primary"
              )}
            >
              {Math.ceil(rushRemainingMs / 1000)}s
            </span>
            <HeartsDisplay lives={state.lives} maxLives={state.maxLives} />
          </div>
        </div>
      )}

      {/* Perfection: X + score pill + hearts pill (no progress bar) */}
      {isPerfection && (
        <div className="flex items-center justify-between">
          <button
            aria-label="Leave quiz"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright"
            onClick={() => setShowLeaveSheet(true)}
            type="button"
          >
            <svg
              aria-hidden
              fill="none"
              height="22"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              width="22"
            >
              <path d="m6 6 12 12" />
              <path d="m18 6-12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <ScorePill score={state.score} />
            <HeartsDisplay lives={state.lives} maxLives={state.maxLives} />
          </div>
        </div>
      )}

      {/* Level test: progress bar only */}
      {isLevelTest && (
        <TopProgressBar
          onClose={() => setShowLeaveSheet(true)}
          progress={progress}
        />
      )}

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
              showCheckIcon={
                (state.isAnswered || flashState !== null) &&
                optionIndex === currentQuestion.correctOptionIndex
              }
              state={buildOptionState(optionIndex)}
            />
          ))}
        </section>
      </AnimatedQuizCard>

      {/* Perfection: show FeedbackSheet */}
      {isPerfection && state.isAnswered && (
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

      {/* Level test: show FeedbackSheet */}
      {isLevelTest && state.isAnswered && (
        <FeedbackSheet
          definition={currentQuestion.definition}
          isBookmarked={isBookmarked}
          isFavorited={isFavorited}
          onNext={handleLevelTestNext}
          onToggleBookmark={() => toggleBookmark(currentQuestion.word)}
          onToggleFavorite={() => toggleFavorite(currentQuestion.word)}
          open={state.isAnswered}
          phonetic={currentQuestion.phonetic}
          sentence={currentQuestion.sentence}
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
