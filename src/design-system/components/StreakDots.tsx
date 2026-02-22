import clsx from "clsx";

export interface StreakDotsProps {
  streak: boolean[];
}

export function StreakDots({ streak }: StreakDotsProps): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-2">
      {streak.map((isComplete, index) => (
        <span
          key={`streak-${index}`}
          className={clsx(
            "h-6 w-6 rounded-full border-2 border-text-secondary/80",
            isComplete &&
              "grid place-items-center border-state-correct bg-state-correct-icon/20 text-state-correct-icon"
          )}
        >
          {isComplete ? "✓" : null}
        </span>
      ))}
    </div>
  );
}
