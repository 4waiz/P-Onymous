"use client";

import { motion } from "framer-motion";
import { Fragment } from "react";
import { EASE_OUT, useTiming } from "./timing";

/** Headline that resolves word by word from faint + blurred to crisp (never left soft). */
export function BlurText({
  text,
  at = 0,
  stagger = 0.1,
  className,
}: {
  text: string;
  at?: number;
  stagger?: number;
  className?: string;
}) {
  const { delay, dur, still } = useTiming();
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <motion.span
            aria-hidden
            className="inline-block"
            initial={still ? false : { opacity: 0, filter: "blur(10px)", y: 4 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0, transitionEnd: { filter: "none" } }}
            transition={{ delay: delay(at + i * stagger), duration: dur(0.55), ease: EASE_OUT }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
