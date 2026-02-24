import { useLocation, useNavigate } from "react-router-dom";

import { LevelLadder } from "@/design-system/components/LevelLadder";
import { Button } from "@/design-system/primitives/Button";
import { Surface } from "@/design-system/primitives/Surface";
import type { CompletedQuizPayload } from "@/types/session";

const levelNames = ["Advanced", "Upper intermediate", "Intermediate", "Elementary", "Beginner"];

function scoreToLevelIndex(score: number, total: number): number {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.9) return 0;
  if (ratio >= 0.75) return 1;
  if (ratio >= 0.55) return 2;
  if (ratio >= 0.35) return 3;
  return 4;
}

export function LevelPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state as CompletedQuizPayload | undefined;

  if (!payload) {
    return (
      <main className="space-y-4 pt-8">
        <h1 className="font-display text-4xl">Level unavailable</h1>
        <Button onClick={() => navigate("/modes")} variant="primary">
          Back to modes
        </Button>
      </main>
    );
  }

  const levelIndex = scoreToLevelIndex(payload.score, payload.total);
  const currentLevel = levelNames[levelIndex] ?? "Beginner";
  const progressToNext = payload.total > 0 ? payload.score / payload.total : 0;

  return (
    <main className="space-y-6 pt-6">
      <div className="relative">
        <p className="absolute right-0 top-0 text-base font-semibold text-text-secondary">Share</p>
        <div className="mx-auto flex h-28 w-28 items-center justify-center text-6xl">🎓</div>
      </div>

      <h1 className="text-center text-3xl font-bold text-text-primary">Your level</h1>

      <Surface className="space-y-2 p-4 text-center" variant="card">
        <p className="font-display text-5xl">{currentLevel}</p>
        <p className="text-base text-text-secondary">Keep learning to level up soon!</p>
      </Surface>

      <div className="grid grid-cols-2 gap-3">
        <Surface className="p-3 text-center" variant="default">
          <p className="text-sm text-text-secondary">Score</p>
          <p className="text-3xl font-bold">
            {payload.score}/{payload.total}
          </p>
        </Surface>
        <Surface className="p-3 text-center" variant="default">
          <p className="text-sm text-text-secondary">Points to next level</p>
          <p className="text-3xl font-bold">{Math.max(payload.total - payload.score, 0)}</p>
        </Surface>
      </div>

      <div className="grid place-items-center py-2">
        <LevelLadder
          currentLevel={currentLevel}
          levels={levelNames}
          progressToNext={progressToNext}
        />
      </div>

      <Button onClick={() => navigate("/results", { state: payload })} variant="primary">
        See answers
      </Button>
      <Button onClick={() => navigate("/modes")} variant="secondary">
        Done
      </Button>
    </main>
  );
}
