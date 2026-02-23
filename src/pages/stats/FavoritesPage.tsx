import { useNavigate } from "react-router-dom";

import { Surface } from "@/design-system/primitives/Surface";
import { getAllModes } from "@/lib/modes";
import { useUserProgress } from "@/lib/userProgressStore";
import type { ModeQuestion } from "@/types/content";

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

function buildWordMap(): Map<string, ModeQuestion> {
  const map = new Map<string, ModeQuestion>();
  for (const mode of getAllModes()) {
    for (const q of mode.questions) {
      if (!map.has(q.word)) {
        map.set(q.word, q);
      }
    }
  }
  return map;
}

export function FavoritesPage(): JSX.Element {
  const navigate = useNavigate();
  const favorites = useUserProgress((s) => s.favorites);
  const toggleFavorite = useUserProgress((s) => s.toggleFavorite);
  const wordMap = buildWordMap();

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
          Favorites
        </h1>
      </header>

      {favorites.length === 0 ? (
        <Surface className="p-6 text-center" variant="default">
          <p className="text-base text-text-secondary">
            No favorites yet. Tap the heart during practice!
          </p>
        </Surface>
      ) : (
        <section className="space-y-3">
          {favorites.map((word) => {
            const q = wordMap.get(word);
            return (
              <Surface className="space-y-1 p-4" key={word} variant="default">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-text-primary">
                      {word}
                    </p>
                    {q && (
                      <p className="text-xs text-text-secondary">
                        {q.phonetic}
                      </p>
                    )}
                  </div>
                  <button
                    aria-label="Unfavorite"
                    className="text-accent-teal"
                    onClick={() => toggleFavorite(word)}
                    type="button"
                  >
                    <svg
                      aria-hidden
                      className="h-5 w-5"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
                {q && (
                  <>
                    <p className="text-sm text-text-secondary">
                      {q.definition}
                    </p>
                    <p className="text-xs italic text-text-secondary">
                      {q.sentence}
                    </p>
                  </>
                )}
              </Surface>
            );
          })}
        </section>
      )}
    </main>
  );
}
