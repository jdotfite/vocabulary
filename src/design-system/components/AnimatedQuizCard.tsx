import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

import { motion as motionTokens } from "@/design-system/tokens/motion";

export interface AnimatedQuizCardProps {
  questionKey: string;
  children: ReactNode;
}

const variants = {
  enter: { opacity: 0, x: 30, scale: 0.97 },
  center: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -30, scale: 0.97 }
};

export function AnimatedQuizCard({
  questionKey,
  children
}: AnimatedQuizCardProps): JSX.Element {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        animate="center"
        exit="exit"
        initial="enter"
        key={questionKey}
        transition={{
          duration: motionTokens.card,
          ease: [0.25, 0.1, 0.25, 1]
        }}
        variants={variants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
