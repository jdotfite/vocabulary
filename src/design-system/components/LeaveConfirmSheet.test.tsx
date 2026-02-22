import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LeaveConfirmSheet } from "@/design-system/components/LeaveConfirmSheet";

describe("LeaveConfirmSheet", () => {
  it("fires keep playing and leave callbacks", () => {
    const onStay = vi.fn();
    const onLeave = vi.fn();
    const onClose = vi.fn();

    render(<LeaveConfirmSheet onClose={onClose} onLeave={onLeave} onStay={onStay} open />);

    fireEvent.click(screen.getByRole("button", { name: "Keep playing" }));
    fireEvent.click(screen.getByRole("button", { name: "Leave" }));

    expect(onStay).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("does not render when closed", () => {
    render(<LeaveConfirmSheet onClose={vi.fn()} onLeave={vi.fn()} onStay={vi.fn()} open={false} />);

    expect(screen.queryByText("Leaving already?")).not.toBeInTheDocument();
  });
});
