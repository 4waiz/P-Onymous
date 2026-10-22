"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { DelayGroup, EASE_OUT, useTiming } from "./timing";
import type { ReactNode } from "react";

type RevealProps = Omit<HTMLMotionProps<"div">, "initial" | "animate" | "transition"> & {
  /** Reference-seconds delay relative to the enclosing group. */
  at?: number;
  y?: number;
  blur?: number;
  scale?: number;
  duration?: number;
  children?: ReactNode;
};

/** Fade + slight lift + blur-to-sharp. The workhorse of the staged reveal. */
export function Reveal({ at = 0, y = 10, blur = 6, scale = 1, duration = 0.42, children, ...rest }: RevealProps) {
  const { delay, dur, still, reduced } = useTiming();
  const d = delay(at);
  return (
    <motion.div
      initial={still ? false : { opacity: 0, y: reduced ? 0 : y, scale: reduced ? 1 : scale, filter: `blur(${blur}px)` }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      transition={{
        default: { type: "spring", stiffness: 300, damping: 30, mass: 0.9, delay: d },
        opacity: { duration: dur(duration * 0.8), delay: d, ease: "easeOut" },
        filter: { duration: dur(duration), delay: d, ease: EASE_OUT },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type PanelProps = Omit<HTMLMotionProps<"section">, "initial" | "animate" | "transition"> & {
  /** When the pale card surface appears (skeleton stage). */
  at?: number;
  /** When the content inside starts revealing; children's `at` values are relative to it. */
  contentAt?: number;
  children?: ReactNode;
};

/**
 * A white card that first lands as an empty pale block (the skeleton frame seen in the film),
 * then lets its children reveal from `contentAt`.
 */
export function Panel({ at = 0, contentAt, className = "", children, ...rest }: PanelProps) {
  const { delay, dur, still, reduced } = useTiming();
  const d = delay(at);
  return (
    <motion.section
      initial={still ? false : { opacity: 0, y: reduced ? 0 : 16, scale: reduced ? 1 : 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        default: { type: "spring", stiffness: 260, damping: 28, mass: 0.9, delay: d },
        opacity: { duration: dur(0.3), delay: d, ease: "easeOut" },
      }}
      className={`rounded-[22px] bg-card shadow-card ${className}`}
      {...rest}
    >
      <DelayGroup delay={contentAt ?? at + 0.15}>{children}</DelayGroup>
    </motion.section>
  );
}
