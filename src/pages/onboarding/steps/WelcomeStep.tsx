import { OnboardingIllustration } from "@/design-system/components/OnboardingIllustration";
import { Button } from "@/design-system/primitives/Button";
import { Text } from "@/design-system/primitives/Text";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps): JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-between py-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <OnboardingIllustration variant="hero" />
        <div className="text-center">
          <Text as="h1" variant="display">
            Welcome to VocabDeck
          </Text>
          <Text className="mt-3 text-text-secondary" variant="body">
            Master words, one card at a time. Let&apos;s personalize your
            experience.
          </Text>
        </div>
      </div>
      <div className="w-full pt-8">
        <Button onClick={onNext} variant="primary">
          Get Started
        </Button>
      </div>
    </div>
  );
}
