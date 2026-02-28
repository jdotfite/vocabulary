import { Button } from "@/design-system/primitives/Button";
import { Surface } from "@/design-system/primitives/Surface";

interface ModeSplashProps {
  title: string;
  rules: { icon: string; text: string }[];
  insight?: string;
  placeholderColor: string;
  onStart: () => void;
  onClose: () => void;
  showDismissToggle?: boolean;
  dismissed: boolean;
  onToggleDismiss: () => void;
}

function CloseIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="22"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      width="22"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function RuleIcon({ icon, color }: { icon: string; color: string }): JSX.Element {
  const iconPaths: Record<string, JSX.Element> = {
    pencil: (
      <path
        d="M17 3l4 4L7 21H3v-4L17 3z"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    ),
    cards: (
      <>
        <rect
          fill="none"
          height="14"
          rx="2"
          stroke={color}
          strokeWidth={2}
          width="14"
          x="2"
          y="8"
        />
        <path
          d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"
          fill="none"
          stroke={color}
          strokeWidth={2}
        />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" fill="none" r="10" stroke={color} strokeWidth={2} />
        <path d="M12 6v6l4 2" fill="none" stroke={color} strokeLinecap="round" strokeWidth={2} />
      </>
    ),
    heart: (
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={2}
      />
    ),
    info: (
      <>
        <circle cx="12" cy="12" fill="none" r="10" stroke={color} strokeWidth={2} />
        <path d="M12 16v-4M12 8h.01" fill="none" stroke={color} strokeLinecap="round" strokeWidth={2} />
      </>
    ),
    chart: (
      <>
        <path d="M18 20V10M12 20V4M6 20v-6" fill="none" stroke={color} strokeLinecap="round" strokeWidth={2} />
      </>
    )
  };

  return (
    <div
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${color}20` }}
    >
      <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
        {iconPaths[icon] ?? iconPaths.info}
      </svg>
    </div>
  );
}

function PlaceholderIllustration({ color, title }: { color: string; title: string }): JSX.Element {
  if (title === "Sprint") {
    return (
      <svg fill="none" height="120" viewBox="0 0 120 120" width="120">
        <circle cx="60" cy="60" r="48" stroke={color} strokeWidth={4} />
        <circle cx="60" cy="60" r="4" fill={color} />
        <line stroke={color} strokeLinecap="round" strokeWidth={4} x1="60" x2="60" y1="60" y2="28" />
        <line stroke={color} strokeLinecap="round" strokeWidth={3} x1="60" x2="80" y1="60" y2="50" />
        <line stroke={color} strokeLinecap="round" strokeWidth={2} x1="60" x2="60" y1="14" y2="20" />
        <line stroke={color} strokeLinecap="round" strokeWidth={2} x1="60" x2="60" y1="100" y2="106" />
        <line stroke={color} strokeLinecap="round" strokeWidth={2} x1="14" x2="20" y1="60" y2="60" />
        <line stroke={color} strokeLinecap="round" strokeWidth={2} x1="100" x2="106" y1="60" y2="60" />
      </svg>
    );
  }

  if (title === "Rush") {
    return (
      <svg fill="none" height="120" viewBox="0 0 120 120" width="120">
        <polygon fill={`${color}30`} points="65,10 40,55 58,55 50,110 85,50 65,50" stroke={color} strokeLinejoin="round" strokeWidth={4} />
      </svg>
    );
  }

  if (title === "Perfection") {
    return (
      <svg fill="none" height="120" viewBox="0 0 120 120" width="120">
        <path
          d="M60 25 L67 45 L88 45 L71 58 L77 78 L60 66 L43 78 L49 58 L32 45 L53 45 Z"
          fill={`${color}30`}
          stroke={color}
          strokeLinejoin="round"
          strokeWidth={4}
        />
        <circle cx="60" cy="60" fill="none" r="48" stroke={color} strokeDasharray="8 6" strokeWidth={3} />
      </svg>
    );
  }

  // Level test — graduation cap
  return (
    <svg fill="none" height="120" viewBox="0 0 120 120" width="120">
      <polygon fill={`${color}30`} points="60,20 15,45 60,70 105,45" stroke={color} strokeLinejoin="round" strokeWidth={4} />
      <line stroke={color} strokeWidth={4} x1="30" x2="30" y1="55" y2="85" />
      <path d="M30,85 Q60,100 90,85" fill="none" stroke={color} strokeWidth={4} />
      <line stroke={color} strokeWidth={3} x1="90" x2="90" y1="55" y2="85" />
      <circle cx="90" cy="90" fill={color} r="3" />
      <line stroke={color} strokeWidth={2} x1="90" x2="90" y1="90" y2="100" />
    </svg>
  );
}

export function ModeSplash({
  title,
  rules,
  insight,
  placeholderColor,
  onStart,
  onClose,
  showDismissToggle = true,
  dismissed,
  onToggleDismiss
}: ModeSplashProps): JSX.Element {
  return (
    <main className="relative flex min-h-[85vh] flex-col px-2 pt-2 pb-20">
      {/* Close button */}
      <button
        aria-label="Close"
        className="flex h-8 w-8 items-center justify-center self-start rounded-full text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright"
        onClick={onClose}
        type="button"
      >
        <CloseIcon />
      </button>

      {/* Illustration */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-4">
        <PlaceholderIllustration color={placeholderColor} title={title} />

        <h1 className="font-display text-3xl font-bold text-text-primary">
          {title}
        </h1>

        {/* Rules card */}
        <Surface className="w-full space-y-3 p-4" variant="default">
          {rules.map((rule) => (
            <div className="flex items-center gap-3" key={rule.text}>
              <RuleIcon color={placeholderColor} icon={rule.icon} />
              <span className="text-sm font-semibold text-text-primary">
                {rule.text}
              </span>
            </div>
          ))}
        </Surface>

        {insight ? (
          <Surface className="w-full p-4" variant="default">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
              Why It Helps
            </p>
            <p className="mt-1 text-sm font-semibold text-text-primary">
              {insight}
            </p>
          </Surface>
        ) : null}
      </div>

      {/* Bottom area */}
      <div className="pb-4">
        <Button onClick={onStart} variant="primary">
          Start
        </Button>
      </div>

      {/* Dismiss toggle — pinned near bottom of viewport */}
      {showDismissToggle && (
        <label className="absolute bottom-6 left-0 right-0 flex cursor-pointer items-center justify-center gap-2">
          <input
            checked={dismissed}
            className="h-4 w-4 rounded border-2 border-border-strong accent-accent-teal"
            onChange={onToggleDismiss}
            type="checkbox"
          />
          <span className="text-sm text-text-secondary">
            Don&apos;t show again
          </span>
        </label>
      )}
    </main>
  );
}
