import { OnboardingIllustration } from "@/design-system/components/OnboardingIllustration";
import { Button } from "@/design-system/primitives/Button";
import { Text } from "@/design-system/primitives/Text";

interface TailorStepProps {
  onNext: () => void;
}

export function TailorStep({ onNext }: TailorStepProps): JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-between py-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <OnboardingIllustration variant="stairs" />
        <div className="text-center">
          <Text as="h1" variant="title">
            Tailor Your Recommendations
          </Text>
          <Text className="mt-3 text-text-secondary" variant="body">
            Answer a few quick questions so we can find the right words for you.
          </Text>
        </div>
      </div>
      <div className="w-full pt-8">
        <Button onClick={onNext} variant="primary">
          Continue
        </Button>
      </div>
    </div>
  );
}
