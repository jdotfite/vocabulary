import clsx from "clsx";

export interface OnboardingOptionProps {
  label: string;
  selected: boolean;
  mode: "radio" | "checkbox";
  onClick: () => void;
}

export function OnboardingOption({
  label,
  selected,
  mode,
  onClick
}: OnboardingOptionProps): JSX.Element {
  return (
    <button
      aria-pressed={selected}
      className={clsx(
        "flex h-option w-full items-center justify-between rounded-button border-2 border-b-[4px] border-border-strong px-5 text-lg font-bold transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app",
        selected
          ? "bg-accent-teal text-bg-app"
          : "bg-bg-surface text-text-primary hover:bg-bg-surface-alt"
      )}
      onClick={onClick}
      type="button"
    >
      <span className="text-left">{label}</span>
      <span
        className={clsx(
          "flex h-6 w-6 shrink-0 items-center justify-center border-2",
          mode === "radio" ? "rounded-full" : "rounded-md",
          selected
            ? "border-bg-app bg-bg-app"
            : "border-text-secondary bg-transparent"
        )}
      >
        {selected && mode === "radio" ? (
          <span className="h-2.5 w-2.5 rounded-full bg-accent-teal" />
        ) : null}
        {selected && mode === "checkbox" ? (
          <svg
            aria-hidden
            className="h-4 w-4 text-accent-teal"
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
      </span>
    </button>
  );
}
