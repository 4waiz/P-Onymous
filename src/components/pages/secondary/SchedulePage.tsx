"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { Pill } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/overlay";
import { Toggle } from "@/components/ui/Toggle";
import { cx } from "@/lib/cx";
import { MONTH_NAMES, dayMonth, money, nowStamp } from "@/lib/format";
import { useAppState, useDispatch } from "@/lib/store";
import { CardTitle, PageHeader } from "../PageHeader";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function SchedulePage() {
  const { bills, balanceUSD } = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const [month, setMonth] = useState({ y: 2026, m: 4 });
  const [day, setDay] = useState<number | null>(null);

  const key = `${month.y}-${String(month.m).padStart(2, "0")}`;
  const monthBills = bills.filter((b) => b.due.startsWith(key));
  const dueDays = new Set(monthBills.map((b) => Number(b.due.slice(8, 10))));
  const unpaid = bills.filter((b) => !b.paid);
  const dueTotal = unpaid.reduce((s, b) => s + b.amount, 0);

  const cells = useMemo(() => {
    const first = new Date(month.y, month.m - 1, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(month.y, month.m, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)] as (number | null)[];
  }, [month]);

  const list = (day ? monthBills.filter((b) => Number(b.due.slice(8, 10)) === day) : bills).slice().sort((a, b) => Number(a.paid) - Number(b.paid) || a.due.localeCompare(b.due));

  const shift = (d: number) => {
    setDay(null);
    setMonth(({ y, m }) => {
      const n = m + d;
      return n < 1 ? { y: y - 1, m: 12 } : n > 12 ? { y: y + 1, m: 1 } : { y, m: n };
    });
  };

  const payAll = () => {
    const total = unpaid.reduce((s, b) => s + b.amount, 0);
    if (total > balanceUSD) return toast({ title: "Not enough balance", tone: "error" });
    unpaid.forEach((b) => dispatch({ type: "payBill", id: b.id, at: nowStamp() }));
    toast({ title: `Paid ${unpaid.length} bills`, description: money(total) });
  };

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Bills and scheduled payments, lined up before they’re due."
        actions={
          <Button size="lg" className="h-[47px] px-[24px] text-[14.5px]" disabled={unpaid.length === 0} onClick={payAll}>
            Pay all due · {money(dueTotal, 0)}
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-[1fr_1.2fr]">
        <Panel at={0.1} contentAt={0.25} className="p-[22px]">
          <Reveal className="flex items-center justify-between">
            <CardTitle>
              {MONTH_NAMES[month.m - 1]} {month.y}
            </CardTitle>
            <div className="flex gap-1">
              <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-well">
                <ChevronLeft size={17} />
              </button>
              <button type="button" aria-label="Next month" onClick={() => shift(1)} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-well">
                <ChevronRight size={17} />
              </button>
            </div>
          </Reveal>
          <Reveal at={0.05} className="mt-4 grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="pb-1 text-[11px] text-muted">
                {w}
              </span>
            ))}
            {cells.map((d, i) =>
              d === null ? (
                <span key={`e${i}`} />
              ) : (
                <button
                  key={d}
                  type="button"
                  aria-pressed={day === d}
                  aria-label={`${d} ${MONTH_NAMES[month.m - 1]}${dueDays.has(d) ? ", bill due" : ""}`}
                  onClick={() => setDay((cur) => (cur === d ? null : d))}
                  className={cx(
                    "relative flex aspect-square items-center justify-center rounded-[12px] text-[13px] transition-colors",
                    day === d ? "bg-pill text-pill-fg" : dueDays.has(d) ? "bg-accent-soft font-semibold text-accent" : "hover:bg-well",
                  )}
                >
                  {d}
                  {dueDays.has(d) && day !== d && <span className="absolute bottom-[6px] h-1 w-1 rounded-full bg-accent" />}
                </button>
              ),
            )}
          </Reveal>
          <Reveal at={0.1} className="mt-4 flex items-center justify-between rounded-[14px] bg-well px-4 py-3 text-[13px]">
            <span className="text-ink-2">{monthBills.length} bills this month</span>
            <span className="num font-semibold">{money(monthBills.reduce((s, b) => s + b.amount, 0))}</span>
          </Reveal>
        </Panel>

        <Panel at={0.15} contentAt={0.3} className="p-[22px]">
          <Reveal className="flex items-center justify-between">
            <CardTitle>{day ? `Due ${day} ${MONTH_NAMES[month.m - 1]}` : "All scheduled"}</CardTitle>
            {day && (
              <button type="button" onClick={() => setDay(null)} className="text-[12.5px] text-accent hover:underline">
                Show all
              </button>
            )}
          </Reveal>
          <ul className="mt-3">
            {list.length === 0 && <li className="py-10 text-center text-[13px] text-muted">Nothing due on this day.</li>}
            {list.map((b, i) => (
              <motion.li key={b.id} layout className={cx(i > 0 && "border-t border-line")}>
                <Reveal at={0.04 + i * 0.05} className={cx("flex flex-wrap items-center gap-3 py-3", b.paid && "opacity-60")}>
                  <span className="flex h-11 w-11 flex-col items-center justify-center rounded-[12px] bg-well text-[9.5px] leading-tight text-muted">
                    <span className="text-[14px] font-semibold text-ink">{Number(b.due.slice(8, 10))}</span>
                    {dayMonth(b.due).split(" ")[1]}
                  </span>
                  <div className="min-w-[140px] flex-1">
                    <p className="text-[13.5px] font-semibold">{b.name}</p>
                    <p className="text-[12px] text-muted">{b.category}</p>
                  </div>
                  <span className="num w-[90px] text-right text-[13.5px] font-semibold">{money(b.amount)}</span>
                  <label className="flex items-center gap-2 text-[11.5px] text-muted">
                    Autopay
                    <Toggle checked={b.autopay} label={`Autopay for ${b.name}`} onChange={() => dispatch({ type: "toggleAutopay", id: b.id })} />
                  </label>
                  {b.paid ? (
                    <Pill tone="pos" className="w-[72px] justify-center gap-1">
                      <CheckCircle2 size={12} /> Paid
                    </Pill>
                  ) : (
                    <Button
                      size="xs"
                      className="w-[72px]"
                      onClick={() => {
                        dispatch({ type: "payBill", id: b.id, at: nowStamp() });
                        toast({ title: `Paid ${b.name}`, description: money(b.amount) });
                      }}
                    >
                      Pay now
                    </Button>
                  )}
                </Reveal>
              </motion.li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
