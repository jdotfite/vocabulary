import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OptionButton } from "@/design-system/components/OptionButton";

describe("OptionButton", () => {
  it("renders enabled default option", () => {
    render(<OptionButton label="sample option" state="default" />);
    const button = screen.getByRole("button", { name: "sample option" });

    expect(button).toBeEnabled();
    expect(button).toHaveAttribute("data-state", "default");
  });

  it("renders disabled state variants", () => {
    render(
      <>
        <OptionButton label="correct option" state="correct" />
        <OptionButton label="incorrect option" state="incorrect" />
      </>
    );

    expect(screen.getByRole("button", { name: "correct option" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "incorrect option" })).toBeDisabled();
  });
});
