import { cx } from "@/lib/cx";
import type { ReactNode } from "react";

/** Tiny tinted change chip: `↑ 5%` (green) / `↓ 5%` (red). */
export function Delta({
  value,
  tone,
  className,
  onDark,
}: {
  value: number;
  tone?: "pos" | "neg";
  className?: string;
  onDark?: boolean;
}) {
  const t = tone ?? (value >= 0 ? "pos" : "neg");
  return (
    <span
      className={cx(
        "inline-flex h-[20px] items-center gap-[3px] rounded-[6px] px-[6px] text-[11px] font-medium leading-none",
        onDark ? "bg-white/20 text-white" : t === "pos" ? "bg-pos-bg text-pos" : "bg-neg-bg text-neg",
        className,
      )}
    >
      <span aria-hidden className="text-[10px]">
        {t === "pos" ? "↑" : "↓"}
      </span>
      {Math.abs(value)}%
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "pos" | "neg" | "warn" | "info" | "accent";
  className?: string;
}) {
  const tones = {
    neutral: "bg-well text-ink-2",
    pos: "bg-pos-bg text-pos",
    neg: "bg-neg-bg text-neg",
    warn: "bg-warn-bg text-warn",
    info: "bg-info-bg text-info",
    accent: "bg-accent-soft text-accent",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex h-[22px] items-center rounded-[7px] px-2 text-[11px] font-medium leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status }: { status: "Completed" | "Pending" | "In Progress" }) {
  const color = status === "Completed" ? "bg-pos" : status === "Pending" ? "bg-neg" : "bg-muted";
  return (
    <span className="inline-flex items-center gap-[7px] text-[13px] text-ink">
      <span className={cx("h-[5px] w-[5px] rounded-full", color)} aria-hidden />
      {status}
    </span>
  );
}
