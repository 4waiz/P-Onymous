"use client";

import { useEffect, useRef, useState } from "react";
import { mulberry32 } from "./runtime";

/**
 * Simulated "live" business signals for the 3D worlds. Deterministic (seeded) so every visitor
 * sees the same believable drift, and paused automatically while the tab is hidden.
 */
function useInterval(cb: () => void, ms: number) {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  }, [cb]);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") ref.current();
    }, ms);
    return () => window.clearInterval(id);
  }, [ms]);
}

/** A counter that grows by a random step in [min, max] every `ms`. */
export function useGrowing(seed: number, ms: number, min: number, max: number) {
  const rng = useRef<() => number>(null);
  const [value, setValue] = useState(0);
  useInterval(() => {
    if (!rng.current) rng.current = mulberry32(seed);
    const r = rng.current();
    setValue((v) => v + min + r * (max - min));
  }, ms);
  return value;
}

/** A value that wanders inside [min, max] (e.g. picking rate, vans out). */
export function useWandering(seed: number, ms: number, min: number, max: number, start?: number) {
  const rng = useRef<() => number>(null);
  const [value, setValue] = useState(start ?? Math.round((min + max) / 2));
  useInterval(() => {
    if (!rng.current) rng.current = mulberry32(seed);
    const r = rng.current();
    setValue((v) => Math.max(min, Math.min(max, Math.round(v + (r - 0.5) * 2.4))));
  }, ms);
  return value;
}

/** Steps through 0..n-1 every `ms` (used to cycle highlighted items). */
export function useCycle(n: number, ms: number) {
  const [i, setI] = useState(0);
  useInterval(() => setI((x) => (n > 0 ? (x + 1) % n : 0)), ms);
  return n > 0 ? i % n : 0;
}
