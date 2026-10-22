"use client";

import { useAnimate } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { MotionProfileProvider, SHOWCASE_PROFILE } from "@/components/motion/timing";
import { AppFrame } from "@/components/shell/AppFrame";
import { MemoryNavProvider } from "@/components/shell/nav";
import { createStore, StoreProvider, type Store } from "@/lib/store";

/** Total running time of the V14 film, in seconds. */
export const FILM_DURATION = 6.3;

/**
 * Runs inside the /showcase iframe at a true 1440×844 desktop viewport. It mounts the real
 * dashboard (fresh, unpersisted seed store; film-paced motion profile; memory navigation) and
 * plays the scene script — page changes and the on-screen pointer — on a deterministic clock.
 */
export function ShowcaseFrame() {
  const [run, setRun] = useState(0);
  const [store, setStore] = useState<Store | null>(null);
  const [path, setPath] = useState("/");
  const [cut, setCut] = useState(false);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const timers = useRef<number[]>([]);

  const navigate = useCallback((href: string) => {
    setCut(false);
    setPath(href);
  }, []);

  const post = useCallback((type: string) => {
    if (window.parent !== window) window.parent.postMessage({ type }, window.location.origin);
  }, []);

  const play = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setStore(createStore());
    setPath("/");
    setCut(false);
    setRun((r) => r + 1);

    const at = (t: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, t * 1000));
    };
    const cursor = () => scope.current;
    const centre = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - 2, y: r.top + r.height / 2 - 2 };
    };
    const moveTo = (selector: string, duration: number) => {
      const c = centre(selector);
      if (c && cursor()) animate(cursor(), { x: c.x, y: c.y }, { duration, ease: [0.33, 0, 0.2, 1] });
    };
    const click = () => {
      if (cursor()) animate(cursor(), { scale: [1, 0.82, 1] }, { duration: 0.18, ease: "easeOut" });
    };

    // Pointer: appears near the header, drifts across the overview toward the rail.
    at(0, () => {
      if (!cursor()) return;
      animate(cursor(), { x: 889, y: 22, opacity: 0, scale: 1 }, { duration: 0 });
      animate(cursor(), { opacity: 1 }, { duration: 0.15, delay: 0.2 });
      animate(cursor(), { x: [889, 419, 360, 165, 158], y: [22, 380, 388, 392, 470] }, { duration: 1.25, delay: 0.2, times: [0, 0.2, 0.4, 0.6, 1], ease: "easeInOut" });
    });

    // Scene 2 — Contacts (via the rail)
    at(1.42, () => moveTo('[data-rail="contacts"]', 0.18));
    at(1.61, click);
    at(1.65, () => navigate("/contacts"));

    // Scene 3 — Savings & Goals (via the rail)
    at(3.18, () => moveTo('[data-rail="savings"]', 0.22));
    at(3.42, click);
    at(3.48, () => navigate("/savings"));

    // Edit cut to an already-settled Activity page, pointer resting on “Manage”.
    at(4.77, () => setCut(true));
    at(4.8, () => {
      setPath("/activity");
      const c = centre('[data-nav="manage"]');
      if (c && cursor()) animate(cursor(), { x: c.x + 14, y: c.y + 8 }, { duration: 0 });
    });

    // Scene 4 — Manage (via the top navigation)
    at(4.93, click);
    at(4.97, () => navigate("/manage"));

    at(FILM_DURATION, () => post("71codes:ended"));
  }, [animate, navigate, post, scope]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "71codes:play") play();
      else if (e.data?.type === "71codes:hello") post("71codes:ready");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) post("71codes:replay");
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKey);
    post("71codes:ready");
    const pending = timers.current;
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKey);
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, [play, post]);

  return (
    <div className="relative h-dvh overflow-hidden bg-surround">
      {store && run > 0 ? (
        <StoreProvider key={run} store={store}>
          <MotionProfileProvider profile={SHOWCASE_PROFILE}>
            <MemoryNavProvider pathname={path} navigate={navigate}>
              <AppFrame cut={cut} />
            </MemoryNavProvider>
          </MotionProfileProvider>
        </StoreProvider>
      ) : (
        // Frame 0 of the film: the empty pale viewport before anything lands.
        <div className="flex h-dvh flex-col">
          <div className="mx-[62px] mt-[28px] flex-1 rounded-t-[36px] bg-canvas" />
        </div>
      )}
      <div ref={scope} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[80] opacity-0" style={{ transformOrigin: "2px 2px" }}>
        <svg width="20" height="26" viewBox="0 0 20 26">
          <path d="M2 1.5v19.2l4.6-4.4 3 7.2 3.3-1.4-3-7h6.4z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
