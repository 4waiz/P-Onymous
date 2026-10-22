"use client";

import { createContext, useContext } from "react";
import type { Vector3 } from "three";

/**
 * Shared, mutable bridge between the DOM overlay (cards, tags, lines) and the WebGL scene.
 * Everything that changes per frame goes through here instead of React state, so a 60fps
 * world never re-renders the page.
 */
export type CardSide = "left" | "right" | "top";

export interface AnchorEntry {
  /** Writes the anchor's current world position into `target`; returns false if unavailable. */
  get(target: Vector3): boolean;
}

export interface OverlayEntry {
  anchor: string;
  kind: "card" | "tag";
  el: HTMLElement;
  side?: CardSide;
  line?: SVGLineElement | null;
  dot?: SVGCircleElement | null;
  halo?: SVGCircleElement | null;
}

export class WorldRegistry {
  anchors = new Map<string, AnchorEntry>();
  overlays = new Map<string, OverlayEntry>();
  selected: string | null = null;
  hovered: string | null = null;
  paused = false;
  reduced = false;
  resetAt = 0;
  onSelect: (id: string | null) => void = () => {};
  onHover: (id: string | null) => void = () => {};

  private parts = new Map<string, Partial<Record<"line" | "dot" | "halo", SVGElement | null>>>();

  select(id: string | null) {
    this.selected = id;
    this.onSelect(id);
  }

  configure(handlers: { onSelect: (id: string | null) => void; onHover: (id: string | null) => void }) {
    this.onSelect = handlers.onSelect;
    this.onHover = handlers.onHover;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  setReduced(reduced: boolean) {
    this.reduced = reduced;
  }

  requestReset() {
    this.resetAt = performance.now();
    this.select(null);
  }

  /** Leader-line SVG parts can mount before or after their card; keep them until both exist. */
  attachPart(key: string, part: "line" | "dot" | "halo", el: SVGElement | null) {
    this.parts.set(key, { ...(this.parts.get(key) ?? {}), [part]: el });
    const entry = this.overlays.get(key);
    if (entry) this.overlays.set(key, { ...entry, [part]: el });
  }

  registerOverlay(key: string, anchor: string, kind: "card" | "tag", el: HTMLElement | null, side?: CardSide) {
    if (!el) {
      this.overlays.delete(key);
      return;
    }
    const parts = this.parts.get(key) ?? {};
    this.overlays.set(key, {
      anchor,
      kind,
      el,
      side,
      line: (parts.line as SVGLineElement | undefined) ?? null,
      dot: (parts.dot as SVGCircleElement | undefined) ?? null,
      halo: (parts.halo as SVGCircleElement | undefined) ?? null,
    });
  }

  hover(id: string | null) {
    if (this.hovered === id) return;
    this.hovered = id;
    this.onHover(id);
  }
}

export const WorldContext = createContext<WorldRegistry | null>(null);

export function useWorld() {
  const registry = useContext(WorldContext);
  if (!registry) throw new Error("useWorld must be used inside a <WorldPanel>");
  return registry;
}

/** Deterministic PRNG so the "live" numbers drift the same way on every load. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
