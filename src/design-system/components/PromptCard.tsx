import clsx from "clsx";

export interface PromptCardProps {
  text: string;
  modeLabel?: string;
}

export function PromptCard({ text, modeLabel }: PromptCardProps): JSX.Element {
  return (
    <div className="space-y-3">
      {modeLabel ? (
        <div className="mx-auto w-fit rounded-full bg-bg-surface px-4 py-1 text-base font-bold text-text-secondary">
          {modeLabel}
        </div>
      ) : null}
      <div className="relative">
        <div className="absolute inset-0 rotate-[3deg] rounded-card bg-bg-surface/25" />
        <div className="absolute inset-0 rotate-[-2deg] rounded-card bg-bg-surface/40" />
        <div
          className={clsx(
            "relative rounded-card border-2 border-b-[4px] border-border-strong bg-bg-surface px-6 py-12",
            "text-center text-2xl font-semibold text-text-primary"
          )}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
