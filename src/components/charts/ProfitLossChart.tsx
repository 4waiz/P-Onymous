"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";
import { EASE_OUT, useTiming } from "@/components/motion/timing";
import { money } from "@/lib/format";
import { StripeDefs, useMeasure } from "./primitives";

const MAX = 50000;
const TICKS = [50000, 40000, 30000, 20000, 10000];

/**
 * Chunky stacked bars: black “Loss” base, coral diagonally-striped “Profit” cap, a few px apart.
 * Bars rise from the fixed baseline left → right, the striped caps land after the bases.
 */
export function ProfitLossChart({
  data,
  at = 0,
}: {
  data: { month: string; loss: number; profit: number }[];
  at?: number;
}) {
  const { delay, dur, still } = useTiming();
  const pid = `stripes-${useId().replace(/:/g, "")}`;
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const plotH = 191;
  const top = 6;
  const base = top + plotH;
  const n = data.length;
  const pitch = width / n;
  const barW = Math.max(10, Math.min(30, pitch - 4.5));
  const gap = 4;
  const y = (v: number) => (v / MAX) * plotH;

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 gap-[13px]">
        {/* y-axis */}
        <div className="relative w-[24px] shrink-0 text-[11px] leading-none text-muted-2" aria-hidden>
          {TICKS.map((t) => (
            <span key={t} className="absolute left-0" style={{ top: top + plotH - y(t) - 5 }}>
              {t / 1000}k
            </span>
          ))}
          <span className="absolute left-0" style={{ top: base + 13 }}>
            0k
          </span>
        </div>

        <div ref={ref} className="relative min-w-0 flex-1" onMouseLeave={() => setHover(null)}>
          {width > 0 && (
            <svg width={width} height={base + 2} className="block overflow-visible" role="img" aria-label="Profit and loss by month">
              <StripeDefs id={pid} />
              {data.map((d, i) => {
                const x = i * pitch + (pitch - barW) / 2;
                const lossH = y(d.loss);
                const profitH = d.profit > 0 ? Math.max(0, y(d.profit) - gap) : 0;
                const barDelay = delay(at + i * 0.065);
                return (
                  <g
                    key={d.month}
                    onMouseEnter={() => setHover(i)}
                    style={{ opacity: hover === null || hover === i ? 1 : 0.55, transition: "opacity .2s" }}
                  >
                    <rect x={x - 2} y={top} width={barW + 4} height={plotH} fill="transparent" />
                    <motion.rect
                      x={x}
                      width={barW}
                      rx={6}
                      fill="var(--ink)"
                      initial={still ? false : { attrY: base, height: 0 }}
                      animate={{ attrY: base - lossH, height: lossH }}
                      transition={{ delay: barDelay, duration: dur(0.5), ease: EASE_OUT }}
                    />
                    {profitH > 0 && (
                      <motion.rect
                        x={x}
                        width={barW}
                        rx={6}
                        fill={`url(#${pid})`}
                        initial={still ? false : { attrY: base - lossH - gap, height: 0, opacity: 0.35 }}
                        animate={{ attrY: base - lossH - gap - profitH, height: profitH, opacity: 1 }}
                        transition={{ delay: barDelay + dur(0.22), duration: dur(0.5), ease: EASE_OUT }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          <AnimatePresence>
            {hover !== null && width > 0 && (
              <motion.div
                key="tip"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-none absolute z-10 rounded-[10px] bg-pill px-2.5 py-1.5 text-[11px] text-pill-fg shadow-pop"
                style={{
                  left: Math.min(Math.max(hover * pitch + pitch / 2 - 52, -8), width - 96),
                  top: Math.max(0, base - y(data[hover].loss + data[hover].profit) - 52),
                }}
              >
                <p className="font-semibold">{data[hover].month}</p>
                <p className="opacity-80">Profit {money(data[hover].profit, 0)}</p>
                <p className="opacity-80">Loss {money(data[hover].loss, 0)}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* month labels */}
          <div className="absolute inset-x-0 flex" style={{ top: base + 12 }} aria-hidden>
            {data.map((d, i) => (
              <span
                key={d.month}
                className="text-center text-[11px] leading-none transition-colors"
                style={{ width: pitch, color: hover === i ? "var(--ink)" : "var(--muted-2)" }}
              >
                {d.month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
