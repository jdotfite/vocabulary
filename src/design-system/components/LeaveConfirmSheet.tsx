import { BottomSheet } from "@/design-system/primitives/BottomSheet";
import { Button } from "@/design-system/primitives/Button";
import { Text } from "@/design-system/primitives/Text";

export interface LeaveConfirmSheetProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
  onClose: () => void;
}

export function LeaveConfirmSheet({
  open,
  onStay,
  onLeave,
  onClose
}: LeaveConfirmSheetProps): JSX.Element | null {
  if (!open) return null;

  return (
    <BottomSheet onClose={onClose} open={open}>
      <div className="space-y-4">
        <Text
          as="h2"
          className="text-center font-display text-4xl text-text-primary"
          variant="title"
        >
          Leaving already?
        </Text>
        <Button onClick={onStay} variant="primary">
          Keep playing
        </Button>
        <Button onClick={onLeave} variant="danger">
          Leave
        </Button>
      </div>
    </BottomSheet>
  );
}
