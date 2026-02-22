import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ResultsListItem } from "@/design-system/components/ResultsListItem";
import { Button } from "@/design-system/primitives/Button";
import { getModeById } from "@/lib/modes";
import type { CompletedQuizPayload } from "@/types/session";

export function ResultsPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state as CompletedQuizPayload | undefined;

  const mode = useMemo(() => getModeById(payload?.modeId ?? ""), [payload?.modeId]);

  if (!payload || !mode) {
    return (
      <main className="space-y-4 pt-8">
        <h1 className="font-display text-4xl">No result session</h1>
        <Button onClick={() => navigate("/modes")} variant="primary">
          Back to modes
        </Button>
      </main>
    );
  }

  const answerByQuestionId = new Map(payload.answers.map((answer) => [answer.questionId, answer]));

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
          onClick={() => navigate("/level", { state: payload })}
          type="button"
        >
          Finish
        </button>
      </header>

      <p className="text-center text-sm text-text-secondary">
        Want to practice these words more? Add them to favorites or to your collections
      </p>

      <section className="pb-4">
        {mode.questions.map((question) => {
          const answer = answerByQuestionId.get(question.id);
          return (
            <ResultsListItem
              definition={question.definition}
              isCorrect={answer?.isCorrect ?? false}
              key={question.id}
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
