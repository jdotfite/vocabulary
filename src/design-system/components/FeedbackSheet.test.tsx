import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FeedbackSheet } from "@/design-system/components/FeedbackSheet";

const baseProps = {
  definition: "sample definition",
  onNext: vi.fn(),
  phonetic: "sam-puhl",
  sentence: "A sample sentence.",
  word: "sample",
  isFavorited: false,
  isBookmarked: false,
  onToggleFavorite: vi.fn(),
  onToggleBookmark: vi.fn()
};

describe("FeedbackSheet", () => {
  it("does not render when closed", () => {
    render(
      <FeedbackSheet {...baseProps} open={false} status="correct" />
    );

    expect(screen.queryByText("That's correct!")).not.toBeInTheDocument();
  });

  it("shows definition when correct", () => {
    render(
      <FeedbackSheet {...baseProps} open status="correct" />
    );

    expect(screen.getByText("That's correct!")).toBeInTheDocument();
    expect(screen.getByText(/sample definition/i)).toBeInTheDocument();
    expect(screen.queryByText(/A sample sentence/i)).not.toBeInTheDocument();
  });

  it("shows sentence when incorrect", () => {
    render(
      <FeedbackSheet {...baseProps} open status="incorrect" />
    );

    expect(screen.getByText("That's incorrect")).toBeInTheDocument();
    expect(screen.getByText("Next word")).toBeInTheDocument();
    expect(screen.getByText(/A sample sentence/i)).toBeInTheDocument();
    expect(screen.queryByText(/sample definition/i)).not.toBeInTheDocument();
  });
});
