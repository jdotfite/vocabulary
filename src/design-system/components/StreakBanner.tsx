import clsx from "clsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Surface } from "@/design-system/primitives/Surface";
import { getPracticeStatsSnapshot } from "@/lib/practiceStats";

function CheckIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      viewBox="0 0 24 24"
      width="12"
    >
      <path d="m5 13 4 4 10-10" />
    </svg>
  );
}

interface DayDot {
  label: string;
  isActive: boolean;
}

export function StreakBanner(): JSX.Element {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const [days, setDays] = useState<DayDot[]>([]);

  useEffect(() => {
    getPracticeStatsSnapshot()
      .then((s) => {
        setStreak(s.streakCount);
        setDays(s.weekActivity);
      })
      .catch(() => undefined);
  }, []);

  return (
    <button
      className="w-full text-left"
      onClick={() => navigate("/stats")}
      type="button"
    >
      <Surface className="flex items-center gap-3 p-3" variant="default">
        <span className="text-2xl" role="img" aria-label="fire">
          🔥
        </span>

        <span className="min-w-0 flex-1 text-base font-bold text-text-primary">
          {streak > 0 ? `${streak} day streak` : "Start your streak today!"}
        </span>

        <div className="flex gap-1.5">
          {days.map((day) => (
            <div
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                day.isActive
                  ? "bg-accent-teal text-bg-app"
                  : "bg-bg-app-deep text-text-secondary"
              )}
              key={day.label}
            >
              {day.isActive ? <CheckIcon /> : day.label.charAt(0)}
            </div>
          ))}
        </div>
      </Surface>
    </button>
  );
}
