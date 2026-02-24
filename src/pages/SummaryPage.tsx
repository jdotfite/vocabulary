import { useLocation, useNavigate } from "react-router-dom";

import { ScoreRing } from "@/design-system/components/ScoreRing";
import { Button } from "@/design-system/primitives/Button";
import { Surface } from "@/design-system/primitives/Surface";
import type { CompletedQuizPayload } from "@/types/session";

function scoreMessage(score: number, total: number): string {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.8) return "Great work!";
  if (ratio >= 0.6) return "Nice progress!";
  return "Keep going!";
}

export function SummaryPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state as CompletedQuizPayload | undefined;

  if (!payload) {
    return (
      <main className="space-y-4 pt-8">
        <h1 className="font-display text-4xl">Session missing</h1>
        <Button onClick={() => navigate("/modes")} variant="primary">
          Back to modes
        </Button>
      </main>
    );
  }

  const percentage = payload.total > 0 ? Math.round((payload.score / payload.total) * 100) : 0;

  return (
    <main className="space-y-6 pt-6 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center text-5xl">📚</div>

      <h1 className="font-display text-6xl font-bold">
        {scoreMessage(payload.score, payload.total)}
      </h1>

      <div className="grid place-items-center">
        <ScoreRing score={payload.score} total={payload.total} />
      </div>

      <p className="text-lg font-bold text-text-primary">
        You scored {percentage}% ({payload.score}/{payload.total})
      </p>

      <Surface className="mx-auto p-4 text-center text-sm text-text-secondary" variant="default">
        Practicing at least 5 days a week allows you to retain <strong className="text-text-primary">25%</strong> more words
      </Surface>

      <Button onClick={() => navigate("/results", { state: payload })} variant="primary">
        See results
      </Button>
      <Button onClick={() => navigate("/modes")} variant="secondary">
        Back to home
      </Button>
    </main>
  );
}
