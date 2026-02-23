import clsx from "clsx";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function StreakWeekRow(): JSX.Element {
  const today = new Date().getDay();
  // JS getDay: 0=Sun, map to Mon-first index
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <div className="flex items-center justify-between gap-2">
      {DAYS.map((day, i) => {
        const isCurrent = i === todayIndex;
        return (
          <div className="flex flex-col items-center gap-1.5" key={day}>
            <span className="text-xs font-semibold text-text-secondary">
              {day}
            </span>
            <span
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-full border-2",
                isCurrent
                  ? "border-accent-teal bg-accent-teal/20 text-accent-teal"
                  : "border-text-secondary/40 text-text-secondary/40"
              )}
            >
              {isCurrent ? (
                <svg
                  aria-hidden
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a1 1 0 011 1v1.07A7.002 7.002 0 0116.93 10H18a1 1 0 110 2h-1.07A7.002 7.002 0 0111 17.93V19a1 1 0 11-2 0v-1.07A7.002 7.002 0 013.07 12H2a1 1 0 110-2h1.07A7.002 7.002 0 019 4.07V3a1 1 0 011-1zm0 4a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
