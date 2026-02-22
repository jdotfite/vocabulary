import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FeedbackSheet } from "@/design-system/components/FeedbackSheet";

describe("FeedbackSheet", () => {
  it("does not render when closed", () => {
    render(
      <FeedbackSheet
        definition="sample definition"
        onNext={vi.fn()}
        open={false}
        phonetic="sam-puhl"
        sentence="A sample sentence."
        status="correct"
        word="sample"
      />
    );

    expect(screen.queryByText("That's correct!")).not.toBeInTheDocument();
  });

  it("shows definition when correct", () => {
    render(
      <FeedbackSheet
        definition="sample definition"
        onNext={vi.fn()}
        open
        phonetic="sam-puhl"
        sentence="A sample sentence."
        status="correct"
        word="sample"
      />
    );

    expect(screen.getByText("That's correct!")).toBeInTheDocument();
    expect(screen.getByText(/sample definition/i)).toBeInTheDocument();
    expect(screen.queryByText(/A sample sentence/i)).not.toBeInTheDocument();
  });

  it("shows sentence when incorrect", () => {
    render(
      <FeedbackSheet
        definition="sample definition"
        onNext={vi.fn()}
        open
        phonetic="sam-puhl"
        sentence="A sample sentence."
        status="incorrect"
        word="sample"
      />
    );

    expect(screen.getByText("That's incorrect")).toBeInTheDocument();
    expect(screen.getByText("Next word")).toBeInTheDocument();
    expect(screen.getByText(/A sample sentence/i)).toBeInTheDocument();
    expect(screen.queryByText(/sample definition/i)).not.toBeInTheDocument();
  });
});
