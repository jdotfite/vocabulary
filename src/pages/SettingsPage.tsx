import { useNavigate } from "react-router-dom";

import { Surface } from "@/design-system/primitives/Surface";

function BackIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function SettingsPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="space-y-4 pt-3">
      <header className="flex items-center gap-3">
        <button
          aria-label="Back"
          className="flex h-7 w-7 items-center justify-center rounded-full text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright"
          onClick={() => navigate("/stats")}
          type="button"
        >
          <BackIcon />
        </button>
        <h1 className="font-display text-4xl font-bold text-text-primary">
          Settings
        </h1>
      </header>

      <Surface className="p-6 text-center" variant="default">
        <p className="text-base text-text-secondary">
          Settings are coming soon!
        </p>
      </Surface>
    </main>
  );
}
