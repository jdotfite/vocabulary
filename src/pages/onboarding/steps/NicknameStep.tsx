import { useState } from "react";

import { Button } from "@/design-system/primitives/Button";
import { Text } from "@/design-system/primitives/Text";

interface NicknameStepProps {
  value: string | null;
  onSubmit: (nickname: string | null) => void;
  onSkip: () => void;
}

export function NicknameStep({
  value,
  onSubmit,
  onSkip
}: NicknameStepProps): JSX.Element {
  const [input, setInput] = useState(value ?? "");

  return (
    <div className="flex flex-1 flex-col py-8">
      <Text as="h1" variant="title">
        What should we call you?
      </Text>
      <Text className="mt-2 text-text-secondary" variant="body">
        Pick a nickname for your profile.
      </Text>
      <input
        autoFocus
        className="mt-6 h-option w-full rounded-button border-2 border-b-[4px] border-border-strong bg-bg-surface px-5 text-lg font-bold text-text-primary placeholder:text-text-secondary/60 focus:border-accent-teal focus:outline-none"
        maxLength={50}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Your nickname"
        type="text"
        value={input}
      />
      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button
          disabled={input.trim().length === 0}
          onClick={() => onSubmit(input.trim() || null)}
          variant="primary"
        >
          Continue
        </Button>
        <button
          className="self-center text-sm font-semibold text-text-secondary underline-offset-2 hover:underline"
          onClick={onSkip}
          type="button"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
