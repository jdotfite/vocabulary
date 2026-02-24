import clsx from "clsx";

import { Surface } from "@/design-system/primitives/Surface";

interface ChallengeCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor?: string;
  locked?: boolean;
  onClick?: () => void;
}

export function ChallengeCard({
  title,
  subtitle,
  icon,
  accentColor,
  locked,
  onClick
}: ChallengeCardProps): JSX.Element {
  return (
    <button
      className={clsx(
        "w-[140px] flex-shrink-0 text-left",
        locked && "opacity-50"
      )}
      disabled={locked}
      onClick={onClick}
      type="button"
    >
      <Surface
        className="flex h-[120px] flex-col justify-between p-3"
        variant="default"
      >
        <span className="text-2xl" style={accentColor ? { color: accentColor } : undefined}>
          {icon}
        </span>
        <div>
          <p
            className="text-sm font-bold"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {title}
          </p>
          <p className="text-xs font-semibold text-text-secondary">
            {locked ? "Coming soon!" : subtitle}
          </p>
        </div>
      </Surface>
    </button>
  );
}
