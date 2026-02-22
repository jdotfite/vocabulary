import clsx from "clsx";
import type { HTMLAttributes } from "react";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "sheet";
}

export function Surface({ variant = "default", className, ...props }: SurfaceProps): JSX.Element {
  return (
    <div
      className={clsx(
        "border-2 border-border-strong shadow-insetSoft",
        variant !== "sheet" && "border-b-[4px]",
        variant === "default" && "rounded-card bg-bg-surface",
        variant === "card" && "rounded-card bg-bg-surface-alt",
        variant === "sheet" && "rounded-t-[28px] bg-bg-sheet",
        className
      )}
      {...props}
    />
  );
}
