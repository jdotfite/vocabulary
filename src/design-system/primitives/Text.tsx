import clsx from "clsx";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

interface TextProps<T extends ElementType> {
  as?: T;
  variant?: "display" | "title" | "body" | "caption";
  className?: string;
  children: ReactNode;
}

type PolymorphicTextProps<T extends ElementType> = TextProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof TextProps<T>>;

export function Text<T extends ElementType = "p">({
  as,
  variant = "body",
  className,
  children,
  ...props
}: PolymorphicTextProps<T>): JSX.Element {
  const Component = as ?? "p";

  return (
    <Component
      className={clsx(
        variant === "display" && "font-display text-4xl font-bold",
        variant === "title" && "text-2xl font-bold",
        variant === "body" && "text-base font-semibold",
        variant === "caption" && "text-sm font-semibold text-text-secondary",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
