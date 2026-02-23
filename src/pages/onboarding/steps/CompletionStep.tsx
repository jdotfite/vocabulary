import { OnboardingIllustration } from "@/design-system/components/OnboardingIllustration";
import { Button } from "@/design-system/primitives/Button";
import { Text } from "@/design-system/primitives/Text";

interface CompletionStepProps {
  saving: boolean;
  onFinish: () => void;
}

export function CompletionStep({
  saving,
  onFinish
}: CompletionStepProps): JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-between py-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <OnboardingIllustration variant="completion" />
        <div className="text-center">
          <Text as="h1" variant="title">
            You&apos;re All Set!
          </Text>
          <Text className="mt-3 text-text-secondary" variant="body">
            Your personalized experience is ready. Time to build your
            vocabulary.
          </Text>
        </div>
      </div>
      <div className="w-full pt-8">
        <Button disabled={saving} onClick={onFinish} variant="primary">
          {saving ? "Saving..." : "Start Learning"}
        </Button>
      </div>
    </div>
  );
}
