import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { NavCard } from "@/design-system/components/NavCard";
import { Surface } from "@/design-system/primitives/Surface";
import {
  formatPracticeDate,
  getPracticeStatsSnapshot
} from "@/lib/practiceStats";
import type { PracticeStatsSnapshot } from "@/lib/practiceStats";
import { useUserProgress } from "@/lib/userProgressStore";

interface StatTileProps {
  value: number;
  label: string;
  icon: JSX.Element;
}

function CloseIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function ChevronRightIcon(): JSX.Element {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PracticeIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="22"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width="22"
    >
      <path d="M2 8.5 12 4l10 4.5-10 4.5z" />
      <path d="M6 10.5v4.2c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8v-4.2" />
      <path d="M22 9v4" />
    </svg>
  );
}

function FireIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="22"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width="22"
    >
      <path d="M12 3s1 2.5 1 4.2c0 1.3-.8 2.3-1.8 3.2C9 12.2 8 14 8 16.1A4 4 0 0 0 12 20a4 4 0 0 0 4-3.9c0-3.8-2.1-6.4-4-8.6" />
      <path d="M10.8 16.2c0 1 .8 1.8 1.8 1.8s1.8-.8 1.8-1.8c0-1.2-.7-2.2-1.5-3.1-.4.8-2.1 1.7-2.1 3.1" />
    </svg>
  );
}

function CheckIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="m5 13 4 4 10-10" />
    </svg>
  );
}

function ReadIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3z" />
      <path d="M8 7h7" />
      <path d="M8 11h7" />
    </svg>
  );
}

function HeartIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  );
}

function BookmarkIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="M6 4h12v16l-6-3-6 3z" />
    </svg>
  );
}

function StatTile({ value, label, icon }: StatTileProps): JSX.Element {
  return (
    <Surface className="flex items-start justify-between p-3" variant="default">
      <div>
        <p className="text-3xl font-bold leading-none text-text-primary">
          {value}
        </p>
        <p className="mt-1 text-base font-semibold text-text-secondary">
          {label}
        </p>
      </div>
      <div className="text-accent-teal">{icon}</div>
    </Surface>
  );
}

export function StatsPage(): JSX.Element {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PracticeStatsSnapshot | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const favorites = useUserProgress((s) => s.favorites);
  const wordStats = useUserProgress((s) => s.wordStats);

  const loadStats = useCallback(() => {
    setFetchError(false);
    getPracticeStatsSnapshot()
      .then((s) => setStats(s))
      .catch(() => setFetchError(true));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (fetchError) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">Could not load stats.</p>
        <button
          className="rounded-button border-2 border-border-strong bg-bg-surface px-5 py-2 text-sm font-bold text-text-primary"
          onClick={loadStats}
          type="button"
        >
          Retry
        </button>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">Loading stats...</p>
      </main>
    );
  }

  const lastScoreText = stats.lastPractice
    ? `${stats.lastPractice.score}/${stats.lastPractice.total}`
    : "0/0";
  const lastDateText = stats.lastPractice
    ? formatPracticeDate(stats.lastPractice.completedAt)
    : "No practice yet";

  return (
    <main className="space-y-4 pt-3">
      <header className="flex items-center gap-3">
        <button
          aria-label="Close stats"
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded-full text-text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright"
          )}
          onClick={() => navigate("/modes")}
          type="button"
        >
          <CloseIcon />
        </button>
        <h1 className="flex-1 font-display text-5xl font-bold text-text-primary">
          Word stats
        </h1>
        <button
          aria-label="Settings"
          className={clsx(
            "flex h-7 w-7 items-center justify-center rounded-full text-text-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright"
          )}
          onClick={() => navigate("/settings")}
          type="button"
        >
          <svg
            aria-hidden
            fill="none"
            height="20"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
            width="20"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      <Surface
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => navigate("/stats/history")}
        variant="default"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-teal/20 text-accent-teal">
            <PracticeIcon />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none text-text-primary">
              {lastScoreText}
            </p>
            <p className="mt-1 text-base font-semibold text-text-primary">
              test score{" "}
              <span className="text-sm font-bold text-text-secondary">
                {lastDateText}
              </span>
            </p>
          </div>
        </div>
        <div className="text-text-secondary">
          <ChevronRightIcon />
        </div>
      </Surface>

      <Surface className="space-y-3 p-4" variant="default">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-state-incorrect/25 text-state-incorrect">
              <FireIcon />
            </div>
            <p className="text-3xl font-bold text-text-primary">Your streak</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-bg-app-deep text-xl font-bold text-text-primary">
            {stats.streakCount}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          {stats.weekActivity.map((day) => (
            <span key={`weekday-${day.label}`}>{day.label}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {stats.weekActivity.map((day) => (
            <span
              className={clsx(
                "grid h-8 w-8 place-items-center rounded-full border-2 border-text-secondary/50 bg-bg-app-deep text-text-secondary",
                day.isActive &&
                  "border-accent-teal bg-accent-teal text-bg-app"
              )}
              key={`streak-day-${day.label}`}
            >
              {day.isActive ? <CheckIcon /> : null}
            </span>
          ))}
        </div>
      </Surface>

      <section className="grid grid-cols-2 gap-3">
        <StatTile icon={<ReadIcon />} label="Read" value={stats.wordsRead} />
        <StatTile
          icon={<HeartIcon />}
          label="Favorited"
          value={stats.favoritedCount}
        />
        <StatTile
          icon={<BookmarkIcon />}
          label="Saved"
          value={stats.bookmarkedCount}
        />
        <StatTile
          icon={<PracticeIcon />}
          label="Practices"
          value={stats.practices}
        />
      </section>

      {/* Percentile placeholder */}
      <Surface className="space-y-3 p-4 text-center" variant="default">
        <p className="text-sm font-bold uppercase tracking-widest text-text-secondary">
          Vocabulary percentile
        </p>
        <div className="flex h-16 items-end justify-center gap-[3px]">
          {[1, 2, 4, 7, 10, 14, 18, 22, 18, 14, 10, 7, 4, 2, 1].map(
            (h, i) => (
              <div
                className="w-3 rounded-t bg-bg-surface-alt"
                key={i}
                style={{ height: `${h * 3}px` }}
              />
            )
          )}
        </div>
        <p className="text-xs text-text-secondary">Coming soon</p>
      </Surface>

      {/* Your Vocabulary */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary">
          Your vocabulary
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <NavCard
            count={favorites.length}
            icon="❤️"
            onClick={() => navigate("/stats/favorites")}
            title="Favorites"
          />
          <NavCard
            count={Object.keys(wordStats).length}
            icon="📖"
            onClick={() => navigate("/stats/words")}
            title="Your words"
          />
          <NavCard
            count={stats.practices}
            icon="📊"
            onClick={() => navigate("/stats/history")}
            title="History"
          />
          <NavCard icon="📁" locked title="Collections" />
        </div>
      </section>
    </main>
  );
}
