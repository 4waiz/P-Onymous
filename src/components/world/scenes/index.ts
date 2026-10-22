import type { ComponentType } from "react";
import { AccountWorld } from "./AccountWorld";
import { ActivityWorld } from "./ActivityWorld";
import { ContactsWorld } from "./ContactsWorld";
import { InboxWorld } from "./InboxWorld";
import { OverviewWorld } from "./OverviewWorld";
import { ProgramWorld } from "./ProgramWorld";
import { ReportsWorld } from "./ReportsWorld";
import { SavingsWorld } from "./SavingsWorld";
import { ScheduleWorld } from "./ScheduleWorld";

export type SceneKey = "overview" | "activity" | "contacts" | "savings" | "reports" | "schedule" | "inbox" | "program" | "account";

/** Optional knobs a page can pass to its world (kept tiny and serialisable). */
export interface SceneProps {
  period?: "6m" | "ytd";
}

export interface SceneCamera {
  /** Half-extents x / z and max height of the diorama, used to auto-frame it. */
  bounds: [number, number, number];
  azimuth: number;
  polar: number;
}

const ISO = Math.PI / 4;
const P = 1.04;

export const SCENES: Record<SceneKey, { Component: ComponentType<SceneProps>; camera: SceneCamera }> = {
  overview: { Component: OverviewWorld, camera: { bounds: [9, 6.5, 4.4], azimuth: ISO, polar: P } },
  activity: { Component: ActivityWorld, camera: { bounds: [9, 6.5, 3.6], azimuth: ISO, polar: P } },
  contacts: { Component: ContactsWorld, camera: { bounds: [9, 6.5, 3.2], azimuth: ISO, polar: P } },
  savings: { Component: SavingsWorld, camera: { bounds: [9, 6, 5.2], azimuth: ISO, polar: P } },
  reports: { Component: ReportsWorld, camera: { bounds: [8.6, 4.5, 5.3], azimuth: ISO * 0.85, polar: 1.06 } },
  schedule: { Component: ScheduleWorld, camera: { bounds: [9, 5, 3.4], azimuth: ISO, polar: P } },
  inbox: { Component: InboxWorld, camera: { bounds: [8.5, 6, 3.6], azimuth: ISO, polar: P } },
  program: { Component: ProgramWorld, camera: { bounds: [8.5, 5.5, 3.8], azimuth: ISO, polar: P } },
  account: { Component: AccountWorld, camera: { bounds: [8, 5.5, 4.4], azimuth: ISO, polar: P } },
};
