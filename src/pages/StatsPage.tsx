import clsx from "clsx";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Surface } from "@/design-system/primitives/Surface";
import { formatPracticeDate, getPracticeStatsSnapshot } from "@/lib/practiceStats";

interface StatTileProps {
  value: number;
  label: string;
  icon: JSX.Element;
}

function CloseIcon(): JSX.Element {
  return (
    <svg aria-hidden fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeWidth={2.5} viewBox="0 0 24 24" width="20">
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function ChevronRightIcon(): JSX.Element {
  return (
    <svg aria-hidden fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" width="20">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PracticeIcon(): JSX.Element {
  return (
    <svg aria-hidden fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width="22">
      <path d="M2 8.5 12 4l10 4.5-10 4.5z" />
      <path d="M6 10.5v4.2c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8v-4.2" />
      <path d="M22 9v4" />
    </svg>
  );
}

function FireIcon(): JSX.Element {
  return (
    <svg aria-hidden fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width="22">
      <path d="M12 3s1 2.5 1 4.2c0 1.3-.8 2.3-1.8 3.2C9 12.2 8 14 8 16.1A4 4 0 0 0 12 20a4 4 0 0 0 4-3.9c0-3.8-2.1-6.4-4-8.6" />
      <path d="M10.8 16.2c0 1 .8 1.8 1.8 1.8s1.8-.8 1.8-1.8c0-1.2-.7-2.2-1.5-3.1-.4.8-2.1 1.7-2.1 3.1" />
    </svg>
  );
}

function CheckIcon(): JSX.Element {
  return (
    <svg aria-hidden fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" width="14">
      <path d="m5 13 4 4 10-10" />
    </svg>
  );
}

function ReadIcon(): JSX.Element {
  return (
    <svg aria-hidden fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width="20">
      <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3z" />
      <path d="M8 7h7" />
      <path d="M8 11h7" />
    </svg>
  );
}

function HeartIcon(): JSX.Element {
  return (
    <svg aria-hidden fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width="20">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  );
}

function BookmarkIcon(): JSX.Element {
  return (
    <svg aria-hidden fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width="20">
      <path d="M6 4h12v16l-6-3-6 3z" />
    </svg>
  );
}

function StatTile({ value, label, icon }: StatTileProps): JSX.Element {
  return (
    <Surface className="flex items-start justify-between p-3" variant="default">
      <div>
        <p className="text-3xl font-bold leading-none text-text-primary">{value}</p>
        <p className="mt-1 text-base font-semibold text-text-secondary">{label}</p>
      </div>
      <div className="text-accent-teal">{icon}</div>
    </Surface>
  );
}

export function StatsPage(): JSX.Element {
  const navigate = useNavigate();
  const stats = useMemo(() => getPracticeStatsSnapshot(), []);

  const lastScoreText = stats.lastPractice ? `${stats.lastPractice.score}/${stats.lastPractice.total}` : "0/0";
  const lastDateText = stats.lastPractice ? formatPracticeDate(stats.lastPractice.completedAt) : "No practice yet";

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
        <h1 className="font-display text-5xl font-bold text-text-primary">Word stats</h1>
      </header>

      <Surface className="flex items-center justify-between p-4" variant="default">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-teal/20 text-accent-teal">
            <PracticeIcon />
          </div>
          <div>
            <p className="text-3xl font-bold leading-none text-text-primary">{lastScoreText}</p>
            <p className="mt-1 text-base font-semibold text-text-primary">
              test score{" "}
              <span className="text-sm font-bold text-text-secondary">{lastDateText}</span>
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
                day.isActive && "border-accent-teal bg-accent-teal text-bg-app"
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
        <StatTile icon={<HeartIcon />} label="Favorited" value={stats.favorited} />
        <StatTile icon={<BookmarkIcon />} label="Saved" value={stats.saved} />
        <StatTile icon={<PracticeIcon />} label="Practices" value={stats.practices} />
      </section>
    </main>
  );
}
