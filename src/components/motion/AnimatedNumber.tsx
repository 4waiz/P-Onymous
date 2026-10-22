"use client";

import { animate, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_COUNT, useTiming } from "./timing";

/**
 * Numeric count-up driven by a motion value. Text is written straight to the DOM node so a
 * 60fps count never re-renders React, and formatting (commas, decimals, currency) is preserved
 * on every frame. Later value changes animate from the previous figure.
 */
export function AnimatedNumber({
  value,
  format,
  at = 0,
  duration = 1.2,
  className,
}: {
  value: number;
  format: (v: number) => string;
  at?: number;
  duration?: number;
  className?: string;
}) {
  const { delay, dur, reduced, instant } = useTiming();
  const startFrom = reduced ? value : instant ? (Math.abs(value) >= 1000 ? value * 0.945 : value) : 0;
  const mv = useMotionValue(startFrom);
  const ref = useRef<HTMLSpanElement>(null);
  const [initialText] = useState(() => format(startFrom));
  const formatRef = useRef(format);
  const mountedAt = useRef<number | null>(null);
  const hasRun = useRef(false);

  const firstDelay = delay(at);
  const firstDuration = instant ? 0.9 : dur(duration);

  useEffect(() => {
    formatRef.current = format;
    if (ref.current) ref.current.textContent = format(mv.get());
  }, [format, mv]);

  useEffect(() => mv.on("change", (v) => {
    if (ref.current) ref.current.textContent = formatRef.current(v);
  }), [mv]);

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const now = performance.now();
    if (mountedAt.current === null) mountedAt.current = now;
    const elapsed = (now - mountedAt.current) / 1000;
    const remaining = firstDelay - elapsed;
    // Still waiting for the scheduled reveal (e.g. persisted data swapped in right after
    // hydration): keep the original entrance timing instead of jumping early.
    const entrance = !hasRun.current || remaining > 0;
    hasRun.current = true;
    const controls = animate(mv, value, entrance
      ? { duration: firstDuration, delay: Math.max(0, remaining), ease: EASE_COUNT }
      : { duration: 0.7, ease: EASE_COUNT });
    return () => controls.stop();
  }, [value, reduced, mv, firstDelay, firstDuration]);

  return (
    <span ref={ref} className={`num ${className ?? ""}`}>
      {initialText}
    </span>
  );
}
