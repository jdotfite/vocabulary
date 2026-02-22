import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import type { PropsWithChildren } from "react";

import { motion as motionTokens } from "@/design-system/tokens/motion";

export interface BottomSheetProps extends PropsWithChildren {
  open: boolean;
  onClose?: () => void;
  className?: string;
}

export function BottomSheet({ open, onClose, className, children }: BottomSheetProps): JSX.Element {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
