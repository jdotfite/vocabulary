import { OnboardingIllustration } from "@/design-system/components/OnboardingIllustration";
import { StreakWeekRow } from "@/design-system/components/StreakWeekRow";
import { Button } from "@/design-system/primitives/Button";
import { Surface } from "@/design-system/primitives/Surface";
import { Text } from "@/design-system/primitives/Text";

interface StreakMotivationStepProps {
  onNext: () => void;
}

export function StreakMotivationStep({
  onNext
}: StreakMotivationStepProps): JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-between py-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <OnboardingIllustration variant="streak" />
        <div className="text-center">
          <Text as="h1" variant="title">
            Build Your Streak
          </Text>
          <Text className="mt-2 text-text-secondary" variant="body">
            Practice daily to keep your streak alive and watch your vocabulary
            grow.
          </Text>
        </div>
        <Surface className="w-full p-5">
          <StreakWeekRow />
        </Surface>
      </div>
      <div className="w-full pt-8">
        <Button onClick={onNext} variant="primary">
          Continue
        </Button>
      </div>
    </div>
  );
}
