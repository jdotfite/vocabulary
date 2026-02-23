import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Surface } from "@/design-system/primitives/Surface";
import { useUserProgress } from "@/lib/userProgressStore";

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(d);
}

interface WordEntry {
  word: string;
  timesSeen: number;
  accuracy: number;
  lastSeenAt: string;
}

export function WordsPage(): JSX.Element {
  const navigate = useNavigate();
  const wordStats = useUserProgress((s) => s.wordStats);

  const words = useMemo<WordEntry[]>(() => {
    return Object.entries(wordStats)
      .map(([word, stat]) => ({
        word,
        timesSeen: stat.timesSeen,
        accuracy:
          stat.timesSeen > 0
            ? Math.round((stat.timesCorrect / stat.timesSeen) * 100)
            : 0,
        lastSeenAt: stat.lastSeenAt
      }))
      .sort(
        (a, b) =>
          new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
      );
  }, [wordStats]);

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
          Your words
        </h1>
      </header>

      {words.length === 0 ? (
        <Surface className="p-6 text-center" variant="default">
          <p className="text-base text-text-secondary">
            No words encountered yet. Start practicing!
          </p>
        </Surface>
      ) : (
        <section className="space-y-2">
          {words.map((entry) => (
            <Surface
              className="flex items-center justify-between p-3"
              key={entry.word}
              variant="default"
            >
              <div>
                <p className="text-base font-bold text-text-primary">
                  {entry.word}
                </p>
                <p className="text-xs text-text-secondary">
                  Seen {entry.timesSeen}x &middot; {formatDate(entry.lastSeenAt)}
                </p>
              </div>
              <span className="text-sm font-bold text-accent-teal">
                {entry.accuracy}%
              </span>
            </Surface>
          ))}
        </section>
      )}
    </main>
  );
}
