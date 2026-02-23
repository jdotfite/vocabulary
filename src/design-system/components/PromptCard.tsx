import clsx from "clsx";

export interface PromptCardProps {
  text: string;
  modeLabel?: string;
}

export function PromptCard({ text, modeLabel }: PromptCardProps): JSX.Element {
  return (
    <div className="space-y-3">
      {modeLabel ? (
        <div className="mx-auto w-fit rounded-full bg-bg-surface px-3.5 py-1 text-sm font-semibold text-text-secondary">
          {modeLabel}
        </div>
      ) : null}
      <div className="relative">
        <div className="absolute -inset-1 rotate-[3deg] rounded-card bg-bg-surface/20" />
        <div className="absolute -inset-0.5 rotate-[-2deg] rounded-card bg-bg-surface/35" />
        <div
          className={clsx(
            "relative rounded-card bg-bg-surface px-6 py-12",
            "text-center text-xl font-normal text-text-primary"
          )}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
