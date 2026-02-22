import clsx from "clsx";

export interface LevelLadderProps {
  levels: string[];
  currentLevel: string;
  progressToNext: number;
}

export function LevelLadder({
  levels,
  currentLevel
}: LevelLadderProps): JSX.Element {
  const currentIndex = levels.findIndex((level) => level === currentLevel);

  return (
    <div className="relative flex flex-col items-start gap-8 py-4">
      {levels.map((level, index) => {
        const isCurrent = index === currentIndex;

        return (
          <div key={level} className="flex items-center gap-5">
            {/* "You •" label — only for current level */}
            <div className="w-12 text-right">
              {isCurrent && (
                <span className="text-sm font-bold text-text-primary">
                  You{" "}
                  <span className="inline-block h-2 w-2 rounded-full bg-text-primary" />
                </span>
              )}
            </div>

            {/* Track segment + dot */}
            <div className="relative flex h-16 w-8 flex-col items-center justify-center">
              {/* Vertical track line (skip above first, below last) */}
              {index !== 0 && (
                <div className="absolute bottom-1/2 left-1/2 top-[-1rem] w-[6px] -translate-x-1/2 rounded-full bg-white/20" />
              )}
              {index !== levels.length - 1 && (
                <div className="absolute bottom-[-1rem] left-1/2 top-1/2 w-[6px] -translate-x-1/2 rounded-full bg-white/20" />
              )}

              {/* Dot */}
              {isCurrent ? (
                <div className="relative z-10 h-10 w-10 rounded-full border-2 border-accent-teal bg-accent-teal/25 shadow-[0_0_0_8px_rgba(147,193,193,0.2)]">
                  <div className="absolute inset-0 m-auto h-3.5 w-3.5 rounded-full bg-white" />
                </div>
              ) : (
                <div className="relative z-10 h-3.5 w-3.5 rounded-full bg-white" />
              )}
            </div>

            {/* Level label */}
            <span
              className={clsx(
                "text-xl font-bold",
                isCurrent ? "text-text-primary" : "text-text-secondary"
              )}
            >
              {level}
            </span>
          </div>
        );
      })}
    </div>
  );
}
