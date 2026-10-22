"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { EASE_OUT, useTiming } from "@/components/motion/timing";
import { cx } from "@/lib/cx";

export function useMeasure<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** SVG diagonal-stripe fill used on coral bars (profit segments, newest savings month). */
export function StripeDefs({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} width="4.2" height="4.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="4.2" height="4.2" fill="#F06A42" />
        <rect width="1.5" height="4.2" fill="#DA4B24" />
      </pattern>
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="1" stopColor="#000" stopOpacity="0.04" />
      </linearGradient>
    </defs>
  );
}

/** Slim coral progress over a pale hatched track; fills left → right. */
export function HatchedProgress({
  value,
  at = 0,
  height = 10,
  className,
  label,
}: {
  value: number;
  at?: number;
  height?: number;
  className?: string;
  label: string;
}) {
  const { delay, dur, still } = useTiming();
  const [entered, markEntered] = useEntered();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cx("hatch-track relative w-full overflow-hidden rounded-full", className)}
      style={{ height }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: "linear-gradient(90deg, #EE6440 0%, #E5502B 100%)" }}
        initial={still ? false : { width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={{ delay: entered ? 0 : delay(at), duration: entered ? 0.6 : dur(0.9), ease: EASE_OUT }}
        onAnimationComplete={markEntered}
      />
    </div>
  );
}

/** After the entrance animation finishes, later value changes should respond immediately. */
export function useEntered(): [boolean, () => void] {
  const [entered, setEntered] = useState(false);
  return [entered, () => setEntered(true)];
}
