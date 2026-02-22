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
  onNext
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
