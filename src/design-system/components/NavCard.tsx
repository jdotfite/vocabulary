import clsx from "clsx";

import { Surface } from "@/design-system/primitives/Surface";

interface NavCardProps {
  title: string;
  count?: number;
  icon: string;
  locked?: boolean;
  onClick?: () => void;
}

function ChevronRightIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function NavCard({
  title,
  count,
  icon,
  locked,
  onClick
}: NavCardProps): JSX.Element {
  return (
    <button
      className={clsx("w-full text-left", locked && "opacity-50")}
      disabled={locked}
      onClick={onClick}
      type="button"
    >
      <Surface className="flex items-center gap-3 p-3" variant="default">
        <span className="text-lg">{icon}</span>
        <span className="min-w-0 flex-1 text-sm font-bold text-text-primary">
          {title}
        </span>
        {locked ? (
          <span className="text-xs font-bold text-text-secondary">Soon</span>
        ) : (
          <>
            {count !== undefined && (
              <span className="text-sm font-bold text-text-secondary">
                {count}
              </span>
            )}
            <span className="text-text-secondary">
              <ChevronRightIcon />
            </span>
          </>
        )}
      </Surface>
    </button>
  );
}
