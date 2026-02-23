import { useNavigate } from "react-router-dom";

import { Button } from "@/design-system/primitives/Button";
import { Surface } from "@/design-system/primitives/Surface";
import { getAllModes } from "@/lib/modes";

const modeDescriptions: Record<string, string> = {
  kids_beginner: "Kindergarten to 1st grade",
  kids_intermediate: "2nd to 3rd grade",
  kids_advanced: "4th to 5th grade",
  adult_beginner: "Adult fundamentals",
  adult_intermediate: "Adult growing vocabulary",
  adult_advanced: "Adult challenge vocabulary"
};

export function ModeSelectPage(): JSX.Element {
  const navigate = useNavigate();
  const modes = getAllModes();

  return (
    <main className="space-y-4 pt-4">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-5xl font-bold">Choose a mode</h1>
          <button
            className="rounded-full border-2 border-border-strong bg-bg-surface px-3 py-1 text-sm font-bold text-text-primary transition-colors duration-fast hover:bg-bg-surface-alt"
            onClick={() => navigate("/stats")}
            type="button"
          >
            Word stats
          </button>
        </div>
        <p className="text-base text-text-secondary">
          MVP uses static JSON content with six fixed difficulty tiers.
        </p>
      </header>

      <section className="space-y-3">
        {modes.map((mode) => (
          <Surface className="space-y-3 p-4" key={mode.modeId} variant="card">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{mode.displayName}</h2>
              <p className="text-sm text-text-secondary">{modeDescriptions[mode.modeId]}</p>
            </div>
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span>
                Rules: {mode.rules.minWordLength}-{mode.rules.maxWordLength} letters
              </span>
              <span>{mode.questions.length} questions</span>
            </div>
            <Button onClick={() => navigate(`/play/${mode.modeId}`)} variant="primary">
              Start
            </Button>
          </Surface>
        ))}
      </section>
    </main>
  );
}
