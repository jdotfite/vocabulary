import { useLocation, useNavigate } from "react-router-dom";

import { ScoreRing } from "@/design-system/components/ScoreRing";
import { StreakDots } from "@/design-system/components/StreakDots";
import { Button } from "@/design-system/primitives/Button";
import { Surface } from "@/design-system/primitives/Surface";
import type { CompletedQuizPayload } from "@/types/session";

function StatCircle({ score, total, label }: { score: number; total: number; label: string }): JSX.Element {
  const ratio = total > 0 ? Math.min(score / total, 1) : 0;
  const degrees = ratio * 360;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative grid h-14 w-14 place-items-center rounded-full"
        style={{
          backgroundImage: `conic-gradient(#AFD681 ${degrees}deg, #3A3A3A ${degrees}deg)`
        }}
      >
        <div className="grid h-[78%] w-[78%] place-items-center rounded-full bg-bg-app text-lg font-bold text-state-correct-icon">
          {score}
        </div>
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">{label}</p>
    </div>
  );
}

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

  const globalAvg = Math.round(payload.total * 0.7);

  return (
    <main className="space-y-6 pt-6 text-center">
      <p className="text-right text-base font-semibold text-text-secondary">Share</p>

      <div className="mx-auto flex h-24 w-24 items-center justify-center text-5xl">📚</div>

      <h1 className="font-display text-6xl font-bold">
        {scoreMessage(payload.score, payload.total)}
      </h1>

      <div className="grid place-items-center">
        <ScoreRing score={payload.score} total={payload.total} />
      </div>

      <div className="flex justify-center gap-8">
        <StatCircle label="Your average" score={payload.score} total={payload.total} />
        <StatCircle label="Global average" score={globalAvg} total={payload.total} />
      </div>

      <div className="space-y-2">
        <p className="text-xl font-bold text-text-primary">Keep it going!</p>
        <p className="text-base text-text-secondary">
          6 days of practice in the last 5 days
        </p>
      </div>

      <StreakDots streak={[false, false, false, false, true]} />

      <Surface className="mx-auto p-4 text-center text-sm text-text-secondary" variant="default">
        Practicing at least 5 days a week allows you to retain <strong className="text-text-primary">25%</strong> more words
      </Surface>

      <Button onClick={() => navigate("/results", { state: payload })} variant="primary">
        See results
      </Button>
    </main>
  );
}
