import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  fullWidth?: boolean;
}

export function Button({
  variant = "secondary",
  fullWidth = true,
  className,
  type = "button",
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={clsx(
        "h-cta rounded-button border-2 border-b-[4px] border-border-strong px-5 text-lg font-bold text-bg-app transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-bright focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app",
        fullWidth && "w-full",
        variant === "primary" && "bg-accent-teal text-bg-app hover:bg-accent-teal-bright",
        variant === "secondary" && "bg-bg-surface text-text-primary hover:bg-bg-surface-alt",
        variant === "danger" && "bg-state-incorrect text-bg-app hover:brightness-105",
        variant === "ghost" && "bg-transparent text-text-primary hover:bg-bg-surface",
        props.disabled && "cursor-not-allowed opacity-70",
        className
      )}
      type={type}
      {...props}
    />
  );
}
