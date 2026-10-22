"use client";

import { motion } from "framer-motion";
import { useId, useState } from "react";
import { EASE_OUT, useTiming } from "@/components/motion/timing";
import { money } from "@/lib/format";
import { StripeDefs, useEntered, useMeasure } from "./primitives";

/** Monthly contributions: pale bars for prior months, coral hatched bar for the newest. */
export function SavingsBars({
  data,
  at = 0,
  height = 182,
}: {
  data: { month: string; amount: number }[];
  at?: number;
  height?: number;
}) {
  const { delay, dur, still } = useTiming();
  const pid = `save-stripes-${useId().replace(/:/g, "")}`;
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const [entered, markEntered] = useEntered();
  const max = Math.max(...data.map((d) => d.amount), 1);
  const n = data.length;
  const pitch = width / n;
  const barW = Math.max(12, Math.min(34, pitch * 0.62));

  return (
    <div className="relative w-full">
      <div ref={ref} className="relative w-full" style={{ height }} onMouseLeave={() => setHover(null)}>
        {width > 0 && (
          <svg width={width} height={height} className="block overflow-visible" role="img" aria-label="Monthly contributions">
            <StripeDefs id={pid} />
            {data.map((d, i) => {
              const h = Math.max(6, (d.amount / max) * height);
              const x = i * pitch + (pitch - barW) / 2;
              const last = i === n - 1;
              return (
                <g key={d.month} onMouseEnter={() => setHover(i)}>
                  <rect x={x - 4} y={0} width={barW + 8} height={height} fill="transparent" />
                  <motion.rect
                    x={x}
                    width={barW}
                    rx={9}
                    fill={last ? `url(#${pid})` : hover === i ? "var(--line-strong)" : "var(--inset-strong)"}
                    initial={still ? false : { attrY: height, height: 0 }}
                    animate={{ attrY: height - h, height: h }}
                    transition={{
                      delay: entered ? 0 : delay(at + i * 0.05 + (last ? 0.06 : 0)),
                      duration: entered ? 0.55 : dur(0.55),
                      ease: EASE_OUT,
                    }}
                    onAnimationComplete={last ? markEntered : undefined}
                  />
                </g>
              );
            })}
          </svg>
        )}
        {hover !== null && width > 0 && (
          <div
            className="pointer-events-none absolute z-10 rounded-[10px] bg-pill px-2.5 py-1.5 text-[11px] text-pill-fg shadow-pop"
            style={{
              left: Math.min(Math.max(hover * pitch + pitch / 2 - 40, -6), width - 80),
              top: Math.max(-8, height - (data[hover].amount / max) * height - 44),
            }}
          >
            <p className="font-semibold">{data[hover].month}</p>
            <p className="opacity-80">{money(data[hover].amount, 0)}</p>
          </div>
        )}
      </div>
      <div className="mt-[11px] flex" aria-hidden>
        {data.map((d, i) => (
          <span
            key={d.month}
            className="text-center text-[11px] leading-none"
            style={{ width: pitch || `${100 / n}%`, color: hover === i ? "var(--ink)" : "var(--muted)" }}
          >
            {d.month}
          </span>
        ))}
      </div>
    </div>
  );
}
