"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";
import { PageTimingProvider, useMotionProfile } from "@/components/motion/timing";
import { BrandMark } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PortalProvider, ToastProvider } from "@/components/ui/overlay";
import { renderPage } from "@/components/pages/registry";
import { useAppState, useDispatch } from "@/lib/store";
import { Header } from "./Header";
import { useNav } from "./nav";
import { Rail } from "./Rail";
import { CutProvider, ShellEntranceProvider } from "./ShellReveal";

/**
 * The floating 71Codes frame: pale rounded canvas on a slightly darker surround, fixed header + rail,
 * and a scrolling main column whose pages transition with AnimatePresence. Used by the real app
 * and (inside an iframe at 1440×845) by the /showcase stage.
 */
export function AppFrame({ cut = false, children }: { cut?: boolean; children?: ReactNode }) {
  const { pathname } = useNav();
  const profile = useMotionProfile();
  const reduced = useReducedMotion();
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLElement>(null);

  // First page waits for the shell to settle; later pages start right after the previous exits.
  const [initialPath] = useState(pathname);
  const [navigated, setNavigated] = useState(false);
  if (!navigated && pathname !== initialPath) setNavigated(true);
  const base = navigated ? 0.05 : 0.35;

  const exitDuration = cut || reduced ? 0 : profile.mode === "showcase" ? 0.09 : 0.16;

  return (
    <PortalProvider target={portal}>
      <ToastProvider>
        <ShellEntranceProvider value={!navigated}>
          <CutProvider value={cut}>
          <LayoutGroup>
            <div className="relative flex h-dvh flex-col overflow-hidden bg-surround">
              <div
                data-frame
                className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas sm:mx-[clamp(0px,4.3vw,62px)] sm:mt-[clamp(0px,1.95vw,28px)] sm:rounded-t-[36px]"
              >
                <Header />
                <div className="flex min-h-0 flex-1">
                  <div className="hidden pl-[38px] pt-[36px] md:block">
                    <Rail />
                  </div>
                  <main
                    ref={scrollRef}
                    id="main"
                    tabIndex={-1}
                    className="no-scrollbar min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-10 pt-[30px] outline-none md:pl-[30px] md:pr-[37px] md:pt-[36px]"
                  >
                    <AnimatePresence
                      mode="wait"
                      initial
                      onExitComplete={() => scrollRef.current?.scrollTo({ top: 0 })}
                    >
                      <motion.div
                        key={pathname}
                        className="min-h-full"
                        exit={{
                          opacity: 0,
                          y: -6,
                          filter: "blur(3px)",
                          transition: { duration: exitDuration, ease: "easeIn" },
                        }}
                      >
                        <PageTimingProvider base={base} instant={cut}>
                          {renderPage(pathname)}
                        </PageTimingProvider>
                      </motion.div>
                    </AnimatePresence>
                    {children}
                  </main>
                </div>
                <SignedOutOverlay />
              </div>
              <div ref={setPortal} className="pointer-events-none fixed inset-0 z-50" />
            </div>
          </LayoutGroup>
          </CutProvider>
        </ShellEntranceProvider>
      </ToastProvider>
    </PortalProvider>
  );
}

function SignedOutOverlay() {
  const { signedOut, profile } = useAppState();
  const dispatch = useDispatch();
  return (
    <AnimatePresence>
      {signedOut && (
        <motion.div
          key="signed-out"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-canvas/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Signed out"
        >
          <motion.div
            initial={{ y: 16, opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
            className="flex w-[min(360px,calc(100%-32px))] flex-col items-center rounded-[28px] bg-card p-8 text-center shadow-pop"
          >
            <BrandMark size={52} />
            <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.01em]">You’re signed out</h2>
            <p className="mt-1.5 text-[13px] text-muted">
              {profile.name}, your demo data is still saved in this browser.
            </p>
            <Button className="mt-6 w-full" size="lg" onClick={() => dispatch({ type: "signIn" })} data-autofocus>
              Sign back in
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
