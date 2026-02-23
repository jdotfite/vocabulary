import clsx from "clsx";

interface TimerBarProps {
  remainingMs: number;
  totalMs: number;
  onClose: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function CloseIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

export function TimerBar({
  remainingMs,
  totalMs,
  onClose
}: TimerBarProps): JSX.Element {
  const fraction = Math.max(0, Math.min(1, remainingMs / totalMs));
  const isWarning = remainingMs <= 30_000;
  const isCritical = remainingMs <= 10_000;

  return (
    <div className="flex items-center gap-3">
      <button
        aria-label="Leave quiz"
        className="flex h-7 w-7 items-center justify-center rounded-full text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright"
        onClick={onClose}
        type="button"
      >
        <CloseIcon />
      </button>

      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-bg-surface">
        <div
          className={clsx(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
            isCritical
              ? "bg-state-incorrect"
              : isWarning
                ? "bg-state-warning"
                : "bg-accent-teal"
          )}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      <span
        className={clsx(
          "min-w-[3rem] text-right text-sm font-bold",
          isCritical
            ? "text-state-incorrect"
            : isWarning
              ? "text-state-warning"
              : "text-text-primary"
        )}
      >
        {formatTime(remainingMs)}
      </span>
    </div>
  );
}
