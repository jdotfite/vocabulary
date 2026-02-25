import clsx from "clsx";
import { motion as motionDiv } from "framer-motion";

import { motion as motionTokens } from "@/design-system/tokens/motion";

export interface OptionButtonProps {
  label: string;
  state: "default" | "correct" | "incorrect" | "disabled";
  showCheckIcon?: boolean;
  motionIndex?: number;
  onClick?: () => void;
}

export function OptionButton({
  label,
  state,
  showCheckIcon = false,
  motionIndex,
  onClick
}: OptionButtonProps): JSX.Element {
  const isDisabled = state !== "default";

  const button = (
    <button
      aria-label={label}
      className={clsx(
        "min-h-[4rem] w-full rounded-button border-2 border-b-[4px] border-border-strong px-5 py-3 text-center text-xl font-bold transition-all duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app",
        "active:scale-[0.98]",
        state === "default" && "bg-bg-surface text-text-primary hover:bg-bg-surface-alt",
        state === "correct" && "scale-[1.02] bg-state-correct text-bg-app",
        state === "incorrect" && "bg-state-incorrect text-bg-app",
        state === "disabled" && "bg-bg-surface text-text-secondary"
      )}
      data-state={state}
      disabled={isDisabled}
      onClick={onClick}
      type="button"
    >
      <span className="relative flex items-center justify-center px-9">
        {showCheckIcon ? (
          <svg
            aria-hidden
            className="absolute left-0 h-7 w-7 text-bg-app"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : null}
        {state === "incorrect" ? (
          <svg
            aria-hidden
            className="absolute left-0 h-7 w-7 text-bg-app"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <line x1="18" x2="6" y1="6" y2="18" />
            <line x1="6" x2="18" y1="6" y2="18" />
          </svg>
        ) : null}
        {label}
      </span>
    </button>
  );

  if (motionIndex === undefined) return button;

  return (
    <motionDiv.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 8 }}
      transition={{
        duration: motionTokens.fast,
        delay: motionIndex * motionTokens.stagger
      }}
    >
      {button}
    </motionDiv.div>
  );
}
