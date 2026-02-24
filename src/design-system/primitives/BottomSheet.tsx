import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { PropsWithChildren } from "react";

import { motion as motionTokens } from "@/design-system/tokens/motion";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface BottomSheetProps extends PropsWithChildren {
  open: boolean;
  onClose?: () => void;
  className?: string;
}

export function BottomSheet({ open, onClose, className, children }: BottomSheetProps): JSX.Element {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    previousActiveRef.current = document.activeElement;

    // Focus first focusable element after animation settles
    const focusTimer = setTimeout(() => {
      const first = sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const sheet = sheetRef.current;
      if (!sheet) return;

      const focusable = sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      if (previousActiveRef.current instanceof HTMLElement) {
        previousActiveRef.current.focus();
      }
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 bg-black/40"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={sheetRef}
            animate={{ y: 0 }}
            className={clsx(
              "absolute inset-x-0 bottom-0 rounded-t-[28px] border-2 border-border-strong bg-bg-sheet p-4",
              className
            )}
            exit={{ y: "100%" }}
            initial={{ y: "100%" }}
            transition={{ duration: motionTokens.sheet }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-bg-surface-alt" />
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
