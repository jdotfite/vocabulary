import clsx from "clsx";

function clamp(value: number): number {
  return Math.max(0, Math.min(value, 1));
}

export interface ScoreRingProps {
  score: number;
  total: number;
  size?: "sm" | "md";
}

export function ScoreRing({ score, total, size = "md" }: ScoreRingProps): JSX.Element {
  const ratio = total > 0 ? clamp(score / total) : 0;
  const degrees = ratio * 360;
  const sizeClass = size === "md" ? "h-32 w-32 text-3xl" : "h-20 w-20 text-xl";

  return (
    <div
      aria-label={`Score ${score} out of ${total}`}
      className={clsx(
        "relative grid place-items-center rounded-full border-2 border-border-strong bg-bg-surface text-text-primary",
        sizeClass
      )}
      style={{
        backgroundImage: `conic-gradient(#AFD681 ${degrees}deg, #3A3A3A ${degrees}deg)`
      }}
    >
      <div className="grid h-[75%] w-[75%] place-items-center rounded-full bg-bg-app font-bold">
        {score}/{total}
      </div>
    </div>
  );
}
