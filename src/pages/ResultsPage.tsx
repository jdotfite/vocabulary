import { useLocation, useNavigate } from "react-router-dom";

import { ResultsListItem } from "@/design-system/components/ResultsListItem";
import { Button } from "@/design-system/primitives/Button";
import { useUserProgress } from "@/lib/userProgressStore";
import type { CompletedQuizPayload } from "@/types/session";

export function ResultsPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state as CompletedQuizPayload | undefined;

  const favorites = useUserProgress((s) => s.favorites);
  const bookmarks = useUserProgress((s) => s.bookmarks);
  const toggleFavorite = useUserProgress((s) => s.toggleFavorite);
  const toggleBookmark = useUserProgress((s) => s.toggleBookmark);

  if (!payload) {
    return (
      <main className="space-y-4 pt-8">
        <h1 className="font-display text-4xl">No result session</h1>
        <Button onClick={() => navigate("/modes")} variant="primary">
          Back to modes
        </Button>
      </main>
    );
  }

  return (
    <main className="space-y-4 pt-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            aria-label="Go back"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright"
            onClick={() => navigate(-1)}
            type="button"
          >
            <svg
              aria-hidden
              fill="none"
              height="22"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              width="22"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1 className="font-display text-3xl">Your results</h1>
        </div>
        <button
          className="text-base font-bold text-text-primary"
          onClick={() => navigate("/modes", { replace: true })}
          type="button"
        >
          Done
        </button>
      </header>

      <p className="text-left text-sm text-text-secondary">
        Want to practice these words more? Add them to favorites or to your collections
      </p>

      <section className="pb-4">
        {payload.answers.map((answer) => {
          const word = answer.word;
          if (!word) return null;
          return (
            <ResultsListItem
              definition={answer.definition ?? ""}
              isBookmarked={bookmarks.includes(word)}
              isCorrect={answer.isCorrect}
              isFavorited={favorites.includes(word)}
              key={answer.questionId}
              onToggleBookmark={() => toggleBookmark(word)}
              onToggleFavorite={() => toggleFavorite(word)}
              phonetic={answer.phonetic ?? ""}
              sentence={answer.sentence ?? ""}
              word={word}
            />
          );
        })}
      </section>
    </main>
  );
}
