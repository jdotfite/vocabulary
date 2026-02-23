import { OnboardingOption } from "@/design-system/primitives/OnboardingOption";
import { Text } from "@/design-system/primitives/Text";

const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" }
] as const;

interface GenderStepProps {
  value: string | null;
  onSelect: (gender: string) => void;
}

export function GenderStep({ value, onSelect }: GenderStepProps): JSX.Element {
  return (
    <div className="flex flex-1 flex-col py-8">
      <Text as="h1" variant="title">
        What is your gender?
      </Text>
      <Text className="mt-2 text-text-secondary" variant="body">
        Optional &mdash; helps us improve recommendations.
      </Text>
      <div className="mt-6 space-y-option-gap">
        {GENDER_OPTIONS.map((opt) => (
          <OnboardingOption
            key={opt.value}
            label={opt.label}
            mode="radio"
            onClick={() => onSelect(opt.value)}
            selected={value === opt.value}
          />
        ))}
      </div>
    </div>
  );
}
