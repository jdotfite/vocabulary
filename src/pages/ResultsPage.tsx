import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ResultsListItem } from "@/design-system/components/ResultsListItem";
import { Button } from "@/design-system/primitives/Button";
import { getAllModes } from "@/lib/modes";
import { useUserProgress } from "@/lib/userProgressStore";
import type { ModeQuestion } from "@/types/content";
import type { CompletedQuizPayload } from "@/types/session";

export function ResultsPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state as CompletedQuizPayload | undefined;

  const questionMap = useMemo(() => {
    const map = new Map<string, ModeQuestion>();
    for (const mode of getAllModes()) {
      for (const q of mode.questions) {
        map.set(q.id, q);
      }
    }
    return map;
  }, []);

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
            className="text-2xl text-text-primary"
            onClick={() => navigate(-1)}
            type="button"
          >
            ←
          </button>
          <h1 className="font-display text-4xl">Your results</h1>
        </div>
        <button
          className="text-base font-bold text-text-primary"
          onClick={() => navigate("/modes", { replace: true })}
          type="button"
        >
          Done
        </button>
      </header>

      <p className="text-center text-sm text-text-secondary">
        Want to practice these words more? Add them to favorites or to your collections
      </p>

      <section className="pb-4">
        {payload.answers.map((answer) => {
          const question = questionMap.get(answer.questionId);
          if (!question) return null;
          return (
            <ResultsListItem
              definition={question.definition}
              isBookmarked={bookmarks.includes(question.word)}
              isCorrect={answer.isCorrect}
              isFavorited={favorites.includes(question.word)}
              key={answer.questionId}
              onToggleBookmark={() => toggleBookmark(question.word)}
              onToggleFavorite={() => toggleFavorite(question.word)}
              phonetic={question.phonetic}
              sentence={question.sentence}
              word={question.word}
            />
          );
        })}
      </section>
    </main>
  );
}
