import { Button } from "@/design-system/primitives/Button";
import { Text } from "@/design-system/primitives/Text";

interface TransitionToTestStepProps {
  onNext: () => void;
}

export function TransitionToTestStep({
  onNext
}: TransitionToTestStepProps): JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-between py-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Text as="h1" variant="title">
          Quick Word Check
        </Text>
        <Text className="text-text-secondary" variant="body">
          Tap the words you already know. This helps us skip what you&apos;ve
          mastered and focus on new vocabulary.
        </Text>
      </div>
      <div className="w-full pt-8">
        <Button onClick={onNext} variant="primary">
          Let&apos;s Go
        </Button>
      </div>
    </div>
  );
}
