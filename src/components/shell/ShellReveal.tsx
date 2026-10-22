"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { createContext, useContext, type ReactNode } from "react";
import { EASE_OUT, useMotionProfile } from "@/components/motion/timing";
import { useReducedMotion } from "framer-motion";

/** Whether the floating shell should play its entrance (first mount only). */
const ShellEntranceContext = createContext(false);

export function ShellEntranceProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <ShellEntranceContext.Provider value={value}>{children}</ShellEntranceContext.Provider>;
}

/** Shell elements fade/slide in during the first ~0.35s of the film, before page content. */
export function ShellReveal({
  at,
  y = -6,
  x = 0,
  children,
  ...rest
}: Omit<HTMLMotionProps<"div">, "initial" | "animate"> & { at: number; y?: number; x?: number; children?: ReactNode }) {
  const entrance = useContext(ShellEntranceContext);
  const profile = useMotionProfile();
  const reduced = useReducedMotion();
  const play = entrance && !reduced;
  return (
    <motion.div
      initial={play ? { opacity: 0, y, x, filter: "blur(4px)" } : false}
      animate={{ opacity: 1, y: 0, x: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      transition={{ delay: at * profile.tempo, duration: 0.4 * profile.durationScale, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function useShellEntrance() {
  return useContext(ShellEntranceContext);
}

/** True while the showcase performs an edit cut — navigation indicators jump instead of sliding. */
const CutContext = createContext(false);

export function CutProvider({ value, children }: { value: boolean; children: ReactNode }) {
  return <CutContext.Provider value={value}>{children}</CutContext.Provider>;
}

export function useCut() {
  return useContext(CutContext);
}
