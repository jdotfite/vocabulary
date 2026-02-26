import { useCallback, useState } from "react";

import { OptionButton } from "@/design-system/components/OptionButton";
import type { OptionButtonProps } from "@/design-system/components/OptionButton";
import { PromptCard } from "@/design-system/components/PromptCard";
import { Button } from "@/design-system/primitives/Button";
import { Text } from "@/design-system/primitives/Text";
import { apiPost } from "@/lib/api";

interface PlacementQuestion {
  id: string;
  wordId: string;
  type: "guess_word" | "meaning_match" | "fill_gap";
  prompt: string;
  word: string;
  phonetic: string;
  definition: string;
  sentence: string;
  options: [string, string, string];
  correctOptionIndex: 0 | 1 | 2;
  difficultyScore: number;
}

interface PlacementRoundResponse {
  questions: PlacementQuestion[];
}

const QUESTIONS_PER_ROUND = 5;
const TOTAL_ROUNDS = 3;
const TOTAL_QUESTIONS = QUESTIONS_PER_ROUND * TOTAL_ROUNDS;

// Inline Elo computation for client-side ability tracking during placement
const ELO_K = 4;
const ELO_SCALE = 15;
function computeElo(
  ability: number,
  difficulty: number,
  isCorrect: boolean
): number {
  const expected =
    1 / (1 + Math.exp((difficulty - ability) / ELO_SCALE));
  const actual = isCorrect ? 1 : 0;
  return Math.max(0, Math.min(100, ability + ELO_K * (actual - expected)));
}

interface PlacementTestProps {
  onComplete: (abilityScore: number) => void;
}

export function PlacementTest({
  onComplete,
}: PlacementTestProps): JSX.Element {
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ability, setAbility] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const fetchRound = useCallback(
    async (targetDifficulty: number) => {
      setLoading(true);
      setError(false);
      try {
        const data = await apiPost<PlacementRoundResponse>(
          "/api/quiz/placement",
          { targetDifficulty, count: QUESTIONS_PER_ROUND }
        );
        if (data.questions.length === 0) {
          setError(true);
          return;
        }
        setQuestions((prev) => [...prev, ...data.questions]);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const startTest = useCallback(() => {
    setPhase("quiz");
    void fetchRound(50);
  }, [fetchRound]);

  // Intro screen
  if (phase === "intro") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-teal/20 text-accent-teal">
          <svg
            aria-hidden
            fill="none"
            height="36"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
            width="36"
          >
            <path d="M2 8.5 12 4l10 4.5-10 4.5z" />
            <path d="M6 10.5v4.2c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8v-4.2" />
            <path d="M22 9v4" />
          </svg>
        </div>
        <Text as="h1" className="mt-6" variant="title">
          Quick placement test
        </Text>
        <Text className="mt-2 text-text-secondary" variant="body">
          Answer 15 questions so we can find the right difficulty for you. It
          takes about 2 minutes.
        </Text>
        <div className="mt-8 w-full">
          <Button onClick={startTest} variant="primary">
            Start test
          </Button>
        </div>
      </div>
    );
  }

  // Result screen
  if (phase === "result") {
    const level =
      ability >= 85
        ? "Advanced"
        : ability >= 70
          ? "Upper Intermediate"
          : ability >= 50
            ? "Intermediate"
            : ability >= 30
              ? "Elementary"
              : "Beginner";
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <Text as="h1" variant="title">
          Your level: {level}
        </Text>
        <Text className="mt-2 text-text-secondary" variant="body">
          You got {score}/{TOTAL_QUESTIONS} correct.
        </Text>
        <p className="mt-4 text-5xl font-bold text-accent-teal">
          {Math.round(ability)}
        </p>
        <Text className="mt-1 text-text-secondary" variant="caption">
          ability score
        </Text>
        <div className="mt-8 w-full">
          <Button onClick={() => onComplete(ability)} variant="primary">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Text className="text-text-secondary" variant="body">
          Could not load questions.
        </Text>
        <Button onClick={() => void fetchRound(ability)} variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  // Loading state
  if (loading || currentIndex >= questions.length) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Text className="text-text-secondary" variant="body">
          Loading questions...
        </Text>
      </div>
    );
  }

  // Quiz screen
  const question = questions[currentIndex];
  if (!question) return <div />;

  const totalAnswered = currentIndex;
  const currentRound = Math.floor(totalAnswered / QUESTIONS_PER_ROUND) + 1;

  const buildOptionState = (
    optionIndex: number
  ): OptionButtonProps["state"] => {
    if (selectedIndex === null) return "default";
    if (optionIndex === question.correctOptionIndex) return "correct";
    if (optionIndex === selectedIndex) return "incorrect";
    return "disabled";
  };

  const handleSelect = (optionIndex: number): void => {
    if (selectedIndex !== null) return;
    setSelectedIndex(optionIndex);

    const isCorrect = optionIndex === question.correctOptionIndex;
    const newAbility = computeElo(ability, question.difficultyScore, isCorrect);
    setAbility(newAbility);
    if (isCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      setSelectedIndex(null);

      if (nextIndex >= TOTAL_QUESTIONS) {
        setCurrentIndex(nextIndex);
        setPhase("result");
        return;
      }

      if (
        nextIndex % QUESTIONS_PER_ROUND === 0 &&
        nextIndex < TOTAL_QUESTIONS
      ) {
        setCurrentIndex(nextIndex);
        void fetchRound(newAbility);
        return;
      }

      setCurrentIndex(nextIndex);
    }, 800);
  };

  return (
    <div className="flex flex-1 flex-col space-y-4 pt-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">
          Round {currentRound}/{TOTAL_ROUNDS}
        </span>
        <span className="font-bold text-text-primary">
          {totalAnswered + 1}/{TOTAL_QUESTIONS}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-bg-surface">
        <div
          className="h-full rounded-full bg-accent-teal transition-all duration-300"
          style={{
            width: `${((totalAnswered + 1) / TOTAL_QUESTIONS) * 100}%`,
          }}
        />
      </div>

      <PromptCard modeLabel="Placement" questionId={question.id} text={question.prompt} />

      <section className="space-y-option-gap pt-2">
        {question.options.map((option, optionIndex) => (
          <OptionButton
            key={`${question.id}-${option}`}
            label={option}
            motionIndex={optionIndex}
            onClick={() => handleSelect(optionIndex)}
            showCheckIcon={
              selectedIndex !== null &&
              optionIndex === question.correctOptionIndex
            }
            state={buildOptionState(optionIndex)}
          />
        ))}
      </section>
    </div>
  );
}
