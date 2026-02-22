import clsx from "clsx";

function clampProgress(progress: number): number {
  return Math.max(0, Math.min(progress, 1));
}

export interface TopProgressBarProps {
  progress: number;
  onClose: () => void;
}

export function TopProgressBar({ progress, onClose }: TopProgressBarProps): JSX.Element {
  const safeProgress = clampProgress(progress);

  return (
    <div className="flex items-center gap-3">
      <button
        aria-label="Exit quiz"
        className={clsx(
          "flex h-7 w-7 items-center justify-center rounded-full text-2xl leading-none text-text-secondary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright"
        )}
        onClick={onClose}
        type="button"
      >
        ×
      </button>
      <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-b-[3px] border-border-strong bg-bg-app-deep">
        <div
          className="h-full rounded-full bg-accent-teal transition-all duration-sheet"
          style={{ width: `${safeProgress * 100}%` }}
        />
      </div>
    </div>
  );
}
