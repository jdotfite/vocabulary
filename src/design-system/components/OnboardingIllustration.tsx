import clsx from "clsx";

export type IllustrationVariant = "hero" | "stairs" | "streak" | "completion";

interface OnboardingIllustrationProps {
  variant: IllustrationVariant;
  className?: string;
}

const EMOJI_MAP: Record<IllustrationVariant, string> = {
  hero: "\u{1F4DA}",
  stairs: "\u{1FA9C}",
  streak: "\u{1F525}",
  completion: "\u{1F389}"
};

const LABEL_MAP: Record<IllustrationVariant, string> = {
  hero: "Stack of books",
  stairs: "Staircase",
  streak: "Fire",
  completion: "Party popper"
};

export function OnboardingIllustration({
  variant,
  className
}: OnboardingIllustrationProps): JSX.Element {
  return (
    <div
      aria-label={LABEL_MAP[variant]}
      className={clsx(
        "flex h-40 w-40 items-center justify-center rounded-full bg-bg-surface",
        className
      )}
      role="img"
    >
      <span className="text-7xl">{EMOJI_MAP[variant]}</span>
    </div>
  );
}
