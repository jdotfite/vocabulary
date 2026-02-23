import { Button } from "@/design-system/primitives/Button";
import { OnboardingOption } from "@/design-system/primitives/OnboardingOption";
import { Text } from "@/design-system/primitives/Text";

interface WordCheckStepProps {
  title: string;
  words: readonly string[];
  selectedWords: string[];
  onToggle: (word: string) => void;
  onNext: () => void;
}

export function WordCheckStep({
  title,
  words,
  selectedWords,
  onToggle,
  onNext
}: WordCheckStepProps): JSX.Element {
  return (
    <div className="flex flex-1 flex-col py-8">
      <Text as="h1" variant="title">
        {title}
      </Text>
      <Text className="mt-2 text-text-secondary" variant="body">
        Tap the words you already know.
      </Text>
      <div className="mt-6 space-y-option-gap">
        {words.map((word) => (
          <OnboardingOption
            key={word}
            label={word.charAt(0).toUpperCase() + word.slice(1)}
            mode="checkbox"
            onClick={() => onToggle(word)}
            selected={selectedWords.includes(word)}
          />
        ))}
      </div>
      <div className="mt-auto pt-8">
        <Button onClick={onNext} variant="primary">
          Continue
        </Button>
      </div>
    </div>
  );
}
