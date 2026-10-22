"use client";

import type { ReactNode } from "react";
import { APP_PROFILE, MotionProfileProvider } from "@/components/motion/timing";
import { appStore, StoreProvider } from "@/lib/store";
import { AppFrame } from "./AppFrame";
import { RouterNavProvider } from "./nav";

/** The real app: persisted store, router navigation, snappy motion profile. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <StoreProvider store={appStore}>
      <MotionProfileProvider profile={APP_PROFILE}>
        <RouterNavProvider>
          <AppFrame>{children}</AppFrame>
        </RouterNavProvider>
      </MotionProfileProvider>
    </StoreProvider>
  );
}
