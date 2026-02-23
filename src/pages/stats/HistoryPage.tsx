import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Surface } from "@/design-system/primitives/Surface";
import { apiGet } from "@/lib/api";

function BackIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

interface SessionRecord {
  id: string;
  modeId: string;
  score: number;
  total: number;
  completedAt: string;
}

interface HistoryResponse {
  sessions: SessionRecord[];
}

const MODE_LABELS: Record<string, string> = {
  kids_beginner: "Kids Beginner",
  kids_intermediate: "Kids Intermediate",
  kids_advanced: "Kids Advanced",
  adult_beginner: "Adult Beginner",
  adult_intermediate: "Adult Intermediate",
  adult_advanced: "Adult Advanced",
  shuffle: "Game Shuffle",
  guess_word: "Guess the Word",
  meaning_match: "Meaning Match",
  fill_gap: "Fill the Gap",
  weak_words: "Weak Words",
  sprint: "Sprint",
  perfection: "Perfection"
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

export function HistoryPage(): JSX.Element {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);

  useEffect(() => {
    apiGet<HistoryResponse>("/api/progress/history")
      .then((data) => setSessions(data.sessions))
      .catch(() => setSessions([]));
  }, []);

  return (
    <main className="space-y-4 pt-3">
      <header className="flex items-center gap-3">
        <button
          aria-label="Back"
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright"
          onClick={() => navigate("/stats")}
          type="button"
        >
          <BackIcon />
        </button>
        <h1 className="font-display text-4xl font-bold text-text-primary">
          History
        </h1>
      </header>

      {sessions === null ? (
        <p className="text-text-secondary">Loading...</p>
      ) : sessions.length === 0 ? (
        <Surface className="p-6 text-center" variant="default">
          <p className="text-base text-text-secondary">
            No practice sessions yet. Start playing!
          </p>
        </Surface>
      ) : (
        <section className="space-y-2">
          {sessions.map((s) => (
            <Surface
              className="flex items-center justify-between p-3"
              key={s.id}
              variant="default"
            >
              <div>
                <p className="text-base font-bold text-text-primary">
                  {MODE_LABELS[s.modeId] ?? s.modeId}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatDateTime(s.completedAt)}
                </p>
              </div>
              <span className="text-sm font-bold text-accent-teal">
                {s.score}/{s.total}
              </span>
            </Surface>
          ))}
        </section>
      )}
    </main>
  );
}
