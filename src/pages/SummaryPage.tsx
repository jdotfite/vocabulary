import { useLocation, useNavigate } from "react-router-dom";

import { ScoreRing } from "@/design-system/components/ScoreRing";
import { Button } from "@/design-system/primitives/Button";
import { Surface } from "@/design-system/primitives/Surface";
import type { AnyModeId } from "@/types/content";
import type { CompletedQuizPayload } from "@/types/session";

function scoreMessage(score: number, total: number): string {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.8) return "Great work!";
  if (ratio >= 0.6) return "Nice progress!";
  return "Keep going!";
}

const CHALLENGE_MODES = new Set<string>(["sprint", "perfection", "rush", "level_test"]);

function getNextActions(
  modeId: AnyModeId,
  score: number,
  total: number
): { label: string; route: string }[] {
  const ratio = total > 0 ? score / total : 0;
  const actions: { label: string; route: string }[] = [];

  // Suggest weak words if accuracy was low
  if (ratio < 0.7 && total >= 5) {
    actions.push({ label: "Practice weak words", route: "/play/weak_words" });
  }

  // Suggest retrying the same mode
  if (CHALLENGE_MODES.has(modeId)) {
    actions.push({ label: "Play again", route: `/play/challenge/${modeId}` });
  } else {
    actions.push({ label: "Play again", route: `/play/${modeId}` });
  }

  // Suggest a different challenge if they did well
  if (ratio >= 0.7) {
    if (modeId !== "rush") {
      actions.push({ label: "Try Rush", route: "/play/challenge/rush" });
    } else {
      actions.push({ label: "Try Sprint", route: "/play/challenge/sprint" });
    }
  }

  return actions.slice(0, 2);
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
  const nextActions = getNextActions(payload.modeId, payload.score, payload.total);

  return (
    <main className="space-y-6 pt-6 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center">
        <svg
          aria-hidden
          fill="none"
          height="56"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          width="56"
        >
          <path className="text-accent-teal" d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" />
          <path className="text-accent-teal" d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" />
        </svg>
      </div>

      <h1 className="font-display text-5xl font-bold">
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

      {nextActions.map((action) => (
        <Button
          key={action.route}
          onClick={() => navigate(action.route)}
          variant="secondary"
        >
          {action.label}
        </Button>
      ))}

      <Button onClick={() => navigate("/modes")} variant="ghost">
        Back to home
      </Button>
    </main>
  );
}
