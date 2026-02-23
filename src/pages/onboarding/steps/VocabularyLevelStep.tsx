import { OnboardingOption } from "@/design-system/primitives/OnboardingOption";
import { Text } from "@/design-system/primitives/Text";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner", desc: "I\u2019m just starting out" },
  {
    value: "intermediate",
    label: "Intermediate",
    desc: "I know common words well"
  },
  {
    value: "advanced",
    label: "Advanced",
    desc: "I want a real challenge"
  }
] as const;

interface VocabularyLevelStepProps {
  value: string | null;
  onSelect: (level: string) => void;
}

export function VocabularyLevelStep({
  value,
  onSelect
}: VocabularyLevelStepProps): JSX.Element {
  return (
    <div className="flex flex-1 flex-col py-8">
      <Text as="h1" variant="title">
        What&apos;s your vocabulary level?
      </Text>
      <Text className="mt-2 text-text-secondary" variant="body">
        We&apos;ll start you off with the right difficulty.
      </Text>
      <div className="mt-6 space-y-option-gap">
        {LEVEL_OPTIONS.map((opt) => (
          <OnboardingOption
            key={opt.value}
            label={`${opt.label} \u2014 ${opt.desc}`}
            mode="radio"
            onClick={() => onSelect(opt.value)}
            selected={value === opt.value}
          />
        ))}
      </div>
    </div>
  );
}
