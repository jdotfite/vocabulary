import clsx from "clsx";

export interface OptionButtonProps {
  label: string;
  state: "default" | "correct" | "incorrect" | "disabled";
  showCheckIcon?: boolean;
  onClick?: () => void;
}

export function OptionButton({
  label,
  state,
  showCheckIcon = false,
  onClick
}: OptionButtonProps): JSX.Element {
  const isDisabled = state !== "default";

  return (
    <button
      aria-label={label}
      className={clsx(
        "h-option w-full rounded-button border-2 border-b-[4px] border-border-strong px-5 text-center text-[1.375rem] font-bold transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app",
        state === "default" && "bg-bg-surface text-text-primary hover:bg-bg-surface-alt",
        state === "correct" && "bg-state-correct text-bg-app",
        state === "incorrect" && "bg-state-incorrect text-bg-app",
        state === "disabled" && "bg-bg-app-deep text-text-secondary"
      )}
      data-state={state}
      disabled={isDisabled}
      onClick={onClick}
      type="button"
    >
      <span className="relative flex items-center justify-center">
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
        {label}
      </span>
    </button>
  );
}
