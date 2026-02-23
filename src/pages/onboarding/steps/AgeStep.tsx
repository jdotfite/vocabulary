import { OnboardingOption } from "@/design-system/primitives/OnboardingOption";
import { Text } from "@/design-system/primitives/Text";

const AGE_OPTIONS = [
  { value: "13-17", label: "13 - 17" },
  { value: "18-24", label: "18 - 24" },
  { value: "25-34", label: "25 - 34" },
  { value: "35-44", label: "35 - 44" },
  { value: "45-54", label: "45 - 54" },
  { value: "55+", label: "55+" }
] as const;

interface AgeStepProps {
  value: string | null;
  onSelect: (ageRange: string) => void;
  onSkip: () => void;
}

export function AgeStep({ value, onSelect, onSkip }: AgeStepProps): JSX.Element {
  return (
    <div className="flex flex-1 flex-col py-8">
      <Text as="h1" variant="title">
        How old are you?
      </Text>
      <Text className="mt-2 text-text-secondary" variant="body">
        This helps us pick age-appropriate content.
      </Text>
      <div className="mt-6 space-y-option-gap">
        {AGE_OPTIONS.map((opt) => (
          <OnboardingOption
            key={opt.value}
            label={opt.label}
            mode="radio"
            onClick={() => onSelect(opt.value)}
            selected={value === opt.value}
          />
        ))}
      </div>
      <button
        className="mt-6 self-center text-sm font-semibold text-text-secondary underline-offset-2 hover:underline"
        onClick={onSkip}
        type="button"
      >
        Skip
      </button>
    </div>
  );
}
