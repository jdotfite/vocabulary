import clsx from "clsx";

import { BottomSheet } from "@/design-system/primitives/BottomSheet";
import { Button } from "@/design-system/primitives/Button";
import { Text } from "@/design-system/primitives/Text";

export interface FeedbackSheetProps {
  open: boolean;
  status: "correct" | "incorrect";
  word: string;
  phonetic: string;
  definition: string;
  sentence: string;
  onNext: () => void;
  isFavorited: boolean;
  isBookmarked: boolean;
  onToggleFavorite: () => void;
  onToggleBookmark: () => void;
}

function SpeakerIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      className="inline-block h-5 w-5 text-text-secondary"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08" />
    </svg>
  );
}

export function FeedbackSheet({
  open,
  status,
  word,
  definition,
  sentence,
  onNext,
  isFavorited,
  isBookmarked,
  onToggleFavorite,
  onToggleBookmark
}: FeedbackSheetProps): JSX.Element | null {
  if (!open) return null;

  const isCorrect = status === "correct";

  return (
    <BottomSheet open={open}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={clsx(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white",
              isCorrect ? "bg-state-correct-icon" : "bg-state-error-icon"
            )}
          >
            {isCorrect ? "✓" : "✕"}
          </span>
          <Text as="h2" className="text-3xl font-bold text-text-primary" variant="title">
            {isCorrect ? "That's correct!" : "That's incorrect"}
          </Text>
        </div>

        {!isCorrect && (
          <p className="text-base text-text-secondary">Correct answer:</p>
        )}

        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-text-primary">{word}</p>
          <SpeakerIcon />
          <div className="ml-auto flex items-center gap-3">
            <button
              aria-label={isFavorited ? "Unfavorite word" : "Favorite word"}
              onClick={onToggleFavorite}
              type="button"
            >
              <svg
                aria-hidden
                className={clsx("h-5 w-5", isFavorited ? "text-accent-teal" : "text-text-secondary")}
                fill={isFavorited ? "currentColor" : "none"}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark word"}
              onClick={onToggleBookmark}
              type="button"
            >
              <svg
                aria-hidden
                className={clsx("h-5 w-5", isBookmarked ? "text-accent-teal" : "text-text-secondary")}
                fill={isBookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {isCorrect ? (
          <p className="text-base font-semibold text-text-primary">
            Definition: <span className="font-normal">{definition}</span>
          </p>
        ) : (
          <p className="text-base font-semibold text-text-primary">
            Used in a sentence: <span className="font-normal">{sentence}</span>
          </p>
        )}

        <Button onClick={onNext} variant="primary">
          Next word
        </Button>
      </div>
    </BottomSheet>
  );
}
