import clsx from "clsx";

export interface ResultsListItemProps {
  word: string;
  phonetic: string;
  definition: string;
  sentence: string;
  isCorrect: boolean;
  partOfSpeech?: string;
}

function SpeakerIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      className="h-4 w-4 shrink-0 text-text-secondary"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.08" />
    </svg>
  );
}

function BookmarkIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      className="h-5 w-5 text-text-secondary"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ResultsListItem({
  word,
  phonetic,
  definition,
  sentence,
  isCorrect,
  partOfSpeech
}: ResultsListItemProps): JSX.Element {
  return (
    <div className="border-b border-bg-surface-alt py-3">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={clsx(
            "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white",
            isCorrect ? "bg-state-correct-icon" : "bg-state-error-icon"
          )}
        >
          {isCorrect ? "✓" : "✕"}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-text-primary">{word}</p>
              <span className="text-sm text-text-secondary">/{phonetic}/</span>
              <SpeakerIcon />
            </div>
            <div className="flex items-center gap-3">
              <button aria-label="Favorite word" type="button">
                <svg
                  aria-hidden
                  className="h-5 w-5 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <button aria-label="Bookmark word" type="button">
                <BookmarkIcon />
              </button>
            </div>
          </div>

          <p className="mt-1 text-sm text-text-primary">
            {partOfSpeech ? <span className="text-text-secondary">({partOfSpeech}) </span> : null}
            {definition}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">{sentence}</p>
        </div>
      </div>
    </div>
  );
}
