"use client";

import { useReducedMotion } from "framer-motion";
import { createContext, useContext, type ReactNode } from "react";

/**
 * Every reveal in the app is authored in "reference seconds" — the timing observed in the V14
 * footage. The app plays those schedules faster (tempo < 1); the /showcase stage plays them at
 * the film's own pace (tempo = 1). Same components, same variants, two speeds.
 */
export interface MotionProfile {
  mode: "app" | "showcase";
  /** Multiplier applied to delays. */
  tempo: number;
  /** Multiplier applied to durations. */
  durationScale: number;
}

export const APP_PROFILE: MotionProfile = { mode: "app", tempo: 0.5, durationScale: 0.8 };
export const SHOWCASE_PROFILE: MotionProfile = { mode: "showcase", tempo: 1, durationScale: 1 };

const ProfileContext = createContext<MotionProfile>(APP_PROFILE);

interface PageTiming {
  /** Offset (reference seconds) added to every reveal on the page — used while the shell enters. */
  base: number;
  /** Hard cut: render the settled state immediately (used by the showcase's edit cut). */
  instant: boolean;
}
const PageTimingContext = createContext<PageTiming>({ base: 0, instant: false });
const DelayContext = createContext(0);

export function MotionProfileProvider({ profile, children }: { profile: MotionProfile; children: ReactNode }) {
  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}

export function PageTimingProvider({ base, instant, children }: PageTiming & { children: ReactNode }) {
  return <PageTimingContext.Provider value={{ base, instant }}>{children}</PageTimingContext.Provider>;
}

/** Nested reveal offset: children's delays are relative to this group's start. */
export function DelayGroup({ delay, children }: { delay: number; children: ReactNode }) {
  const parent = useContext(DelayContext);
  return <DelayContext.Provider value={parent + delay}>{children}</DelayContext.Provider>;
}

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_COUNT = [0.18, 0.84, 0.32, 1] as const;

export function useMotionProfile() {
  return useContext(ProfileContext);
}

export function useTiming() {
  const profile = useContext(ProfileContext);
  const page = useContext(PageTimingContext);
  const nested = useContext(DelayContext);
  const reduced = !!useReducedMotion();
  const still = reduced || page.instant;
  return {
    mode: profile.mode,
    reduced,
    instant: page.instant,
    still,
    /** Absolute delay (seconds) for a reveal authored at reference time `s` within the current group. */
    delay: (s = 0) => (still ? 0 : Math.max(0, (page.base + nested + s) * profile.tempo)),
    /** Duration (seconds) for an animation authored at reference duration `s`. */
    dur: (s: number) => (reduced ? 0.001 : s * profile.durationScale),
  };
}
