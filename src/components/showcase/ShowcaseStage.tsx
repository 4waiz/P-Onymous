"use client";

import { RotateCcw, Repeat, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cx } from "@/lib/cx";
import { CodePanel } from "./CodePanel";

/** Logical stage of the source film. */
const STAGE_W = 512;
const STAGE_H = 910;
/** The dashboard viewport inside the film (y 305–605) shows a 1440-wide desktop. */
const APP_TOP = 305;
const APP_H = 300;
const APP_W = 1440;
const APP_SCALE = STAGE_W / APP_W;

function subscribeResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

function useStageScale() {
  return useSyncExternalStore(
    subscribeResize,
    () => Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H),
    () => 1,
  );
}

function readParams() {
  const p = new URLSearchParams(window.location.search);
  return { autoplay: p.get("autoplay") !== "0", loop: p.get("loop") === "1", clean: p.get("clean") === "1" };
}

/**
 * /showcase — the 9:16 black stage from the V14 film: “Dashboard” / orange “V14”, the live
 * 71Codes app playing its scene script inside a scaled 1440px desktop viewport, and the faux
 * JSX editor below. R or the Replay button restarts from frame 0; ?loop=1 repeats; ?clean=1
 * hides the controls; ?autoplay=0 waits for R.
 */
export function ShowcaseStage() {
  const scale = useStageScale();
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [loop, setLoop] = useState(false);
  const [clean, setClean] = useState(true);
  const loopRef = useRef(false);

  const play = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: "71codes:play" }, window.location.origin);
  }, []);

  useEffect(() => {
    const params = readParams();
    loopRef.current = params.loop;
    let isReady = false;
    // Handshake: keep saying hello until the embedded app answers (it may hydrate after us).
    const hello = window.setInterval(() => {
      frame.current?.contentWindow?.postMessage({ type: "71codes:hello" }, window.location.origin);
    }, 200);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const type = e.data?.type;
      if (type === "71codes:ready") {
        if (isReady) return;
        isReady = true;
        window.clearInterval(hello);
        setReady(true);
        setLoop(params.loop);
        setClean(params.clean);
        if (params.autoplay) play();
      } else if (type === "71codes:ended" && loopRef.current) {
        play();
      } else if (type === "71codes:replay") {
        play();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey) play();
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearInterval(hello);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKey);
    };
  }, [play]);

  return (
    <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#010002]">
      <div
        className="relative shrink-0 overflow-hidden bg-[#010002]"
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
        data-stage
      >
        <h1
          className="absolute inset-x-0 text-center font-display font-normal leading-none text-white"
          style={{ top: 222.5, fontSize: 36.5, letterSpacing: "0.005em" }}
        >
          Dashboard
        </h1>
        <p
          className="absolute inset-x-0 text-center font-display font-normal leading-none text-[#FF6F0F]"
          style={{ top: 266, fontSize: 36.5, letterSpacing: "0.01em" }}
        >
          V14
        </p>

        <div className="absolute left-0 overflow-hidden bg-[#E7E4E8]" style={{ top: APP_TOP, width: STAGE_W, height: APP_H }}>
          <iframe
            ref={frame}
            src="/showcase/frame"
            title="71Codes dashboard — live app"
            className="absolute left-0 top-0 origin-top-left border-0"
            style={{ width: APP_W, height: APP_H / APP_SCALE, transform: `scale(${APP_SCALE})` }}
          />
        </div>

        <CodePanel />
      </div>

      {!clean && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 opacity-40 transition-opacity duration-300 hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={play}
            disabled={!ready}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-white/10 px-4 text-[12.5px] font-medium text-white backdrop-blur hover:bg-white/20 disabled:opacity-40"
          >
            <RotateCcw size={14} /> Replay <kbd className="rounded bg-white/15 px-1.5 text-[10px]">R</kbd>
          </button>
          <button
            type="button"
            aria-pressed={loop}
            onClick={() => {
              loopRef.current = !loop;
              setLoop(!loop);
            }}
            className={cx("inline-flex h-9 items-center gap-2 rounded-full px-4 text-[12.5px] font-medium text-white backdrop-blur", loop ? "bg-[#EA552F]" : "bg-white/10 hover:bg-white/20")}
          >
            <Repeat size={14} /> Loop
          </button>
          <Link href="/" className="inline-flex h-9 items-center gap-2 rounded-full bg-white/10 px-4 text-[12.5px] font-medium text-white backdrop-blur hover:bg-white/20">
            <SquareArrowOutUpRight size={14} /> Open app
          </Link>
        </div>
      )}
    </main>
  );
}
