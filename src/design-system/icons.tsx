/**
 * Inline SVG icons matching iconic.app style (24x24, 1.5px stroke).
 * Each icon renders at currentColor and accepts className for sizing.
 */

interface IconProps {
  className?: string;
}

const defaults = {
  "aria-hidden": true as const,
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.5,
  viewBox: "0 0 24 24"
};

/** Lightning bolt — Sprint challenge */
export function BoltIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

/** Diamond — Perfection challenge */
export function DiamondIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M2.7 10.3a1 1 0 0 1 0-1.4l7.2-7.2a1 1 0 0 1 1.4 0l7.2 7.2a1 1 0 0 1 0 1.4l-7.2 7.2a1 1 0 0 1-1.4 0z" />
    </svg>
  );
}

/** Rocket — Rush challenge */
export function RocketIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

/** Graduation cap — Level test */
export function GraduateIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      <path d="M22 10v6" />
    </svg>
  );
}

/** Dice — Shuffle */
export function DiceIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <circle cx="8.5" cy="8.5" fill="currentColor" r="1.5" stroke="none" />
      <circle cx="15.5" cy="8.5" fill="currentColor" r="1.5" stroke="none" />
      <circle cx="8.5" cy="15.5" fill="currentColor" r="1.5" stroke="none" />
      <circle cx="15.5" cy="15.5" fill="currentColor" r="1.5" stroke="none" />
    </svg>
  );
}

/** Message bubble — Guess the word */
export function MessageIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Target — Meaning match */
export function TargetIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

/** Pencil — Fill the gap */
export function PencilIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </svg>
  );
}

/** Dumbbell — Weak words */
export function DumbbellIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M6.5 6.5h11M17.5 4v5M6.5 4v5" />
      <path d="M3 6.5a1.5 1.5 0 0 1 1.5-1.5h1v3h-1A1.5 1.5 0 0 1 3 6.5z" />
      <path d="M18.5 5h1a1.5 1.5 0 0 1 0 3h-1z" />
      <path d="M6.5 15.5h11M17.5 13v5M6.5 13v5" />
      <path d="M3 15.5a1.5 1.5 0 0 1 1.5-1.5h1v3h-1A1.5 1.5 0 0 1 3 15.5z" />
      <path d="M18.5 14h1a1.5 1.5 0 0 1 0 3h-1z" />
    </svg>
  );
}

/** Heart — Favorites */
export function HeartIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/** Book open — Your words */
export function BookOpenIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

/** Bar chart — History */
export function ChartIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

/** Folder — Collections */
export function FolderIcon({ className = "h-6 w-6" }: IconProps): JSX.Element {
  return (
    <svg {...defaults} className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
