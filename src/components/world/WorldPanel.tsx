"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2, MousePointerClick, Pause, Play, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { useMotionProfile } from "@/components/motion/timing";
import { cx } from "@/lib/cx";
import { WorldContext, WorldRegistry } from "./runtime";
import type { SceneKey, SceneProps } from "./scenes";

const WorldCanvas = dynamic(() => import("./WorldCanvas"), {
  ssr: false,
  loading: () => <WorldLoading />,
});

export type Tone = "blue" | "green" | "coral" | "amber" | "purple" | "pink" | "ink";

export const TONE: Record<Tone, { dot: string; soft: string; text: string }> = {
  blue: { dot: "#3B5BEA", soft: "rgba(59,91,234,0.12)", text: "#3150D8" },
  green: { dot: "#1FB07B", soft: "rgba(31,176,123,0.12)", text: "#159567" },
  coral: { dot: "#EA552F", soft: "rgba(234,85,47,0.12)", text: "#D8461F" },
  amber: { dot: "#E9A23B", soft: "rgba(233,162,59,0.16)", text: "#B97A10" },
  purple: { dot: "#8B5CF6", soft: "rgba(139,92,246,0.13)", text: "#7445E8" },
  pink: { dot: "#E2508A", soft: "rgba(226,80,138,0.12)", text: "#C93570" },
  ink: { dot: "#1A171C", soft: "rgba(26,23,28,0.08)", text: "#1A171C" },
};

export interface WorldCardSpec {
  id: string;
  anchor: string;
  side: "left" | "right";
  tone: Tone;
  label: string;
  value: ReactNode;
}

export interface WorldTagSpec {
  id: string;
  anchor: string;
  content: ReactNode;
}

export interface WorldFocusSpec {
  title: string;
  tone: Tone;
  icon: ReactNode;
  rows: [string, ReactNode][];
  footer?: ReactNode;
}

/**
 * A live 3D diorama of the page's data: WebGL scene + glass "LIVE" cards tied to objects by
 * dotted leader lines, click-to-focus detail cards, orbit / pause / reset / fullscreen.
 */
export function WorldPanel({
  scene,
  sceneProps,
  eyebrow,
  cards,
  tags = [],
  focus,
  onSelect,
  hint = "Drag to orbit · click anything",
  height = 460,
  at = 0.08,
}: {
  scene: SceneKey;
  sceneProps?: SceneProps;
  eyebrow: string;
  cards: WorldCardSpec[];
  tags?: WorldTagSpec[];
  focus?: (id: string) => WorldFocusSpec | null;
  onSelect?: (id: string | null) => void;
  hint?: string;
  height?: number;
  at?: number;
}) {
  const profile = useMotionProfile();
  const [registry] = useState(() => new WorldRegistry());
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    registry.configure({
      onSelect: (id) => {
        setSelected(id);
        onSelectRef.current?.(id);
      },
      onHover: (id) => setHovered(id),
    });
  }, [registry]);

  useEffect(() => {
    registry.setPaused(paused);
  }, [paused, registry]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.current?.requestFullscreen?.();
  }, []);

  // The /showcase film recreates the original V14 footage, which has no 3D worlds.
  if (profile.mode === "showcase") return null;

  const focusSpec = selected && focus ? focus(selected) : null;
  const left = cards.filter((c) => c.side === "left");
  const right = cards.filter((c) => c.side === "right");

  return (
    <WorldContext.Provider value={registry}>
      <Panel at={at} contentAt={at + 0.1} className="mb-[24px] overflow-hidden p-0">
        <div
          ref={frame}
          className="world-frame relative w-full overflow-hidden rounded-[22px]"
          style={{ height: fullscreen ? "100vh" : `min(${height}px, calc(46vw + 100px))` }}
        >
          <div aria-hidden className="world-backdrop absolute inset-0" />
          <CanvasBoundary>
            <WorldCanvas scene={scene} sceneProps={sceneProps} />
          </CanvasBoundary>

          {/* Leader lines + anchor dots */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {[...cards.map((c) => ({ key: c.id, tone: c.tone })), ...(focusSpec ? [{ key: "__focus", tone: focusSpec.tone }] : [])].map(
              ({ key, tone }) => (
                <g key={key} data-line={key} style={{ visibility: "hidden" }}>
                  <line
                    ref={(el) => registry.attachPart(key, "line", el)}
                    stroke={TONE[tone].dot}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray="0.1 7"
                    opacity={0.85}
                  />
                  <circle ref={(el) => registry.attachPart(key, "halo", el)} r={13} fill={TONE[tone].dot} className="world-halo" />
                  <circle ref={(el) => registry.attachPart(key, "dot", el)} r={6.5} fill={TONE[tone].dot} stroke="#fff" strokeWidth={3} />
                </g>
              ),
            )}
          </svg>

          {/* Tags pinned to objects (labels, avatars, flags) */}
          <div className="pointer-events-none absolute inset-0">
            {tags.map((t) => (
              <TagEl key={t.id} spec={t} registry={registry} />
            ))}
          </div>

          {/* Card stacks */}
          <div className="pointer-events-none absolute inset-y-0 left-5 hidden flex-col justify-center gap-[10px] md:flex">
            {left.map((c, i) => (
              <CardEl key={c.id} spec={c} index={i} registry={registry} active={hovered === c.anchor || selected === c.anchor} />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-5 hidden flex-col items-end justify-center gap-[10px] md:flex">
            {right.map((c, i) => (
              <CardEl key={c.id} spec={c} index={i} registry={registry} active={hovered === c.anchor || selected === c.anchor} />
            ))}
          </div>

          {/* Focus card for the clicked object */}
          <AnimatePresence mode="wait">
            {focusSpec && selected && (
              <FocusEl key={selected} spec={focusSpec} anchor={selected} registry={registry} onClose={() => registry.select(null)} />
            )}
          </AnimatePresence>

          {/* Chrome */}
          <Reveal at={0.25} className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 sm:bottom-4 sm:left-5">
            <span className="world-chip pointer-events-auto inline-flex h-[28px] items-center gap-2 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
              <span className="relative flex h-[7px] w-[7px]">
                <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative h-[7px] w-[7px] rounded-full bg-accent" />
              </span>
              Live world
              <span className="font-medium normal-case tracking-normal text-muted">· {eyebrow}</span>
            </span>
          </Reveal>
          <Reveal at={0.3} className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 md:block">
            <span className="world-chip inline-flex h-[28px] items-center gap-1.5 rounded-full px-3 text-[11.5px] text-ink-2">
              <MousePointerClick size={13} strokeWidth={1.8} /> {hint}
            </span>
          </Reveal>
          <Reveal at={0.28} className="absolute bottom-3 right-3 flex items-center gap-1.5 sm:bottom-4 sm:right-5">
            <ChromeButton label={paused ? "Play motion" : "Pause motion"} onClick={() => setPaused((p) => !p)}>
              {paused ? <Play size={14} strokeWidth={2} /> : <Pause size={14} strokeWidth={2} />}
            </ChromeButton>
            <ChromeButton
              label="Reset view"
              onClick={() => registry.requestReset()}
            >
              <RotateCcw size={14} strokeWidth={2} />
            </ChromeButton>
            <ChromeButton label={fullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize2 size={14} strokeWidth={2} /> : <Maximize2 size={14} strokeWidth={2} />}
            </ChromeButton>
          </Reveal>
        </div>

        {/* Phones: cards move out of the scene into a swipeable strip so the world stays visible */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3 pt-3 md:hidden" aria-label={`${eyebrow} live figures`}>
          {cards.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => registry.select(selected === c.anchor ? null : c.anchor)}
              className={cx("world-card shrink-0 rounded-[14px] px-3 py-2 text-left", selected === c.anchor && "world-card-active")}
            >
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-ink-2/80">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: TONE[c.tone].dot }} />
                {c.label}
              </span>
              <span className="mt-0.5 block whitespace-nowrap text-[15px] font-bold leading-[20px] tracking-[-0.02em] text-ink">{c.value}</span>
            </button>
          ))}
        </div>
      </Panel>
    </WorldContext.Provider>
  );
}

function CardEl({ spec, index, registry, active }: { spec: WorldCardSpec; index: number; registry: WorldRegistry; active: boolean }) {
  return (
    <Reveal at={0.15 + index * 0.06} x={spec.side === "left" ? -10 : 10} y={0} className={cx(index >= 2 && "hidden md:block")}>
      <div
        ref={(el) => registry.registerOverlay(spec.id, spec.anchor, "card", el, spec.side)}
        onMouseEnter={() => registry.hover(spec.anchor)}
        onMouseLeave={() => registry.hover(null)}
        onClick={() => registry.select(spec.anchor)}
        className={cx(
          "world-card pointer-events-auto w-[168px] cursor-pointer rounded-[16px] px-[14px] py-[10px] transition-[box-shadow,transform] duration-300 sm:w-[184px]",
          active && "world-card-active",
        )}
      >
        <p className="flex items-center gap-[7px] text-[12px] font-medium text-ink-2/80">
          <span className="h-[8px] w-[8px] rounded-full" style={{ background: TONE[spec.tone].dot }} />
          {spec.label}
        </p>
        <div className="mt-[3px] text-[19px] font-bold leading-[24px] tracking-[-0.02em] text-ink">{spec.value}</div>
      </div>
    </Reveal>
  );
}

function TagEl({ spec, registry }: { spec: WorldTagSpec; registry: WorldRegistry }) {
  return (
    <div
      ref={(el) => registry.registerOverlay(spec.id, spec.anchor, "tag", el)}
      className="absolute left-0 top-0 will-change-transform"
      style={{ visibility: "hidden" }}
    >
      {spec.content}
    </div>
  );
}

function FocusEl({
  spec,
  anchor,
  registry,
  onClose,
}: {
  spec: WorldFocusSpec;
  anchor: string;
  registry: WorldRegistry;
  onClose: () => void;
}) {
  const t = TONE[spec.tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="absolute left-1/2 top-3 z-10 -translate-x-1/2 sm:top-4"
    >
      <div
        ref={(el) => registry.registerOverlay("__focus", anchor, "card", el, "top")}
        role="dialog"
        aria-label={spec.title}
        className="world-card pointer-events-auto w-[min(300px,calc(100vw-64px))] rounded-[20px] px-[18px] pb-[14px] pt-[16px]"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full" style={{ background: t.soft, color: t.dot }}>
            {spec.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-bold tracking-[-0.02em] text-ink">{spec.title}</p>
            <p className="flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.text }}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: t.dot }} /> Live
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="-mr-1 -mt-5 inline-flex h-7 w-7 items-center justify-center rounded-full text-[18px] leading-none text-muted hover:bg-well hover:text-ink"
          >
            ×
          </button>
        </div>
        <dl className="mt-3 grid gap-[7px]">
          {spec.rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4">
              <dt className="text-[13.5px] text-muted">{k}</dt>
              <dd className="num text-[16px] font-bold tracking-[-0.01em] text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        {spec.footer && <div className="mt-3">{spec.footer}</div>}
      </div>
    </motion.div>
  );
}

function ChromeButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="world-chip inline-flex h-[30px] w-[30px] items-center justify-center rounded-full text-ink-2 transition-colors hover:text-ink"
    >
      {children}
    </button>
  );
}

function WorldLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="world-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-muted">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-2 border-t-accent" /> Building your world…
      </span>
    </div>
  );
}

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-[13px] text-muted">
          This browser can’t start WebGL, so the live 3D world is unavailable. Everything else still works.
        </div>
      );
    }
    return this.props.children;
  }
}
