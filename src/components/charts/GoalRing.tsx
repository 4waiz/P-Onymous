"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { EASE_OUT, useTiming } from "@/components/motion/timing";
import { useEntered } from "./primitives";

/** Circular goal progress: grey track + coral arc drawn clockwise from 12 o’clock. */
export function GoalRing({ percent, at = 0, size = 118, stroke = 10 }: { percent: number; at?: number; size?: number; stroke?: number }) {
  const { delay, dur, still } = useTiming();
  const [entered, markEntered] = useEntered();
  const r = (size - stroke) / 2;
  const p = Math.max(0, Math.min(100, percent)) / 100;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--inset-strong)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={still ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: p, opacity: p > 0 ? 1 : 0 }}
          transition={{
            delay: entered ? 0 : delay(at),
            duration: entered ? 0.7 : dur(0.85),
            ease: EASE_OUT,
            opacity: { duration: 0.1, delay: entered ? 0 : delay(at) },
          }}
          onAnimationComplete={markEntered}
        />
      </svg>
      <Reveal at={at} y={3} blur={5} className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-[25px] font-semibold leading-none tracking-[-0.02em] text-ink">{Math.round(percent)}%</span>
        <span className="mt-[6px] text-[10px] leading-none text-muted-2">saved</span>
      </Reveal>
    </div>
  );
}
