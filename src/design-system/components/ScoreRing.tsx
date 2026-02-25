import clsx from "clsx";
import { motion } from "framer-motion";

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
  const isMd = size === "md";
  const svgSize = isMd ? 128 : 80;
  const strokeWidth = isMd ? 10 : 7;
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillOffset = circumference * (1 - ratio);
  const sizeClass = isMd ? "h-32 w-32 text-3xl" : "h-20 w-20 text-xl";

  return (
    <div
      aria-label={`Score ${score} out of ${total}`}
      className={clsx("relative grid place-items-center", sizeClass)}
    >
      <svg
        className="-rotate-90"
        fill="none"
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        width={svgSize}
      >
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="#3A3A3A"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          animate={{ strokeDashoffset: fillOffset }}
          cx={svgSize / 2}
          cy={svgSize / 2}
          initial={{ strokeDashoffset: circumference }}
          r={radius}
          stroke="#AFD681"
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute font-bold text-text-primary">
        {score}/{total}
      </div>
    </div>
  );
}
