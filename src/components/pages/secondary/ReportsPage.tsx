"use client";

import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { EASE_OUT, useTiming } from "@/components/motion/timing";
import { Delta } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/overlay";
import { cx } from "@/lib/cx";
import { MONTH_NAMES, money } from "@/lib/format";
import { useAppState } from "@/lib/store";
import type { Transaction, TxIcon } from "@/lib/types";
import { CardTitle, PageHeader } from "../PageHeader";
import { ReportsWorldPanel } from "./SecondaryWorlds";
import { downloadCsv, toCsv } from "../shared/TxTable";

const CATEGORY: Partial<Record<TxIcon, string>> = {
  app: "Software & apps",
  software: "Software & apps",
  cloud: "Software & apps",
  hotel: "Travel",
  flight: "Travel",
  grocery: "Food & groceries",
  food: "Food & groceries",
  rent: "Rent & office",
  equipment: "Rent & office",
  utilities: "Bills & utilities",
  insurance: "Bills & utilities",
  bill: "Bills & utilities",
  ads: "Marketing",
  design: "Marketing",
  transfer: "Transfers",
  savings: "Savings",
};

const CAT_COLORS = ["var(--accent)", "var(--ink)", "#8574EA", "#3C78E0", "#24A266", "#D8457F", "#C98B0B", "var(--muted-2)"];

const whole = (v: number) => money(v, 0);

export function ReportsPage() {
  const state = useAppState();
  const toast = useToast();
  const [period, setPeriod] = useState<"6m" | "ytd">("ytd");
  const series = useMemo(() => {
    const data = state.pnl.map((m) => ({ month: m.month, income: m.loss + m.profit, expenses: m.loss }));
    return period === "6m" ? data.slice(-6) : data;
  }, [state.pnl, period]);
  const income = series.reduce((s, m) => s + m.income, 0);
  const expenses = series.reduce((s, m) => s + m.expenses, 0);
  const net = income - expenses;

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    state.transactions
      .filter((t) => t.direction === "out")
      .forEach((t) => map.set(CATEGORY[t.icon] ?? "Other", (map.get(CATEGORY[t.icon] ?? "Other") ?? 0) + t.amount));
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
    return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, amount], i) => ({ name, amount, share: amount / total, color: CAT_COLORS[i % CAT_COLORS.length] }));
  }, [state.transactions]);

  const statements = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    state.transactions.forEach((t) => {
      const key = t.at.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), t]);
    });
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [state.transactions]);

  const format = useCallback((v: number) => money(v, 0), []);

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Cash flow, categories and statements — clear numbers, no spreadsheets."
        actions={
          <Button
            size="lg"
            className="h-[47px] px-[24px] text-[14.5px]"
            icon={<Download size={15} strokeWidth={1.9} />}
            onClick={() => {
              downloadCsv("71codes-all-transactions.csv", toCsv(state.transactions));
              toast({ title: "Statement exported", description: `${state.transactions.length} transactions` });
            }}
          >
            Export all
          </Button>
        }
      />

      <ReportsWorldPanel period={period} />
      <div className="mb-[24px] grid grid-cols-1 gap-[24px] sm:grid-cols-3">
        {[
          { label: "Income", value: income, delta: 9 },
          { label: "Expenses", value: expenses, delta: -4 },
          { label: "Net profit", value: net, delta: 14 },
        ].map((s, i) => (
          <Panel key={s.label} at={0.08 + i * 0.04} contentAt={0.2 + i * 0.04} className="p-[22px]">
            <Reveal className="text-[13.5px] text-ink-2">{s.label}</Reveal>
            <Reveal at={0.03} className="mt-3">
              <AnimatedNumber value={s.value} format={format} at={0.05} className="block text-[30px] font-[650] leading-[36px] tracking-[-0.025em]" />
            </Reveal>
            <Reveal at={0.06} className="mt-3 flex items-center gap-2 text-[11.5px] text-muted">
              <Delta value={s.delta} /> vs previous period
            </Reveal>
          </Panel>
        ))}
      </div>

      <div className="mb-[24px] grid grid-cols-1 gap-[24px] xl:grid-cols-[1.6fr_1fr]">
        <Panel at={0.2} contentAt={0.32} className="p-[22px]">
          <Reveal className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Cash flow</CardTitle>
              <p className="mt-1 text-[12.5px] text-muted">Income against expenses, month by month</p>
            </div>
            <div className="flex h-[34px] items-center rounded-full bg-well p-[3px]" role="radiogroup" aria-label="Period">
              {(
                [
                  ["6m", "6 months"],
                  ["ytd", "Year to date"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={period === k} onClick={() => setPeriod(k)} className={cx("relative h-[28px] rounded-full px-3 text-[12px] transition-colors", period === k ? "text-ink" : "text-muted")}>
                  {period === k && <motion.span layoutId="reports-period" className="absolute inset-0 rounded-full bg-card shadow-card" transition={{ type: "spring", stiffness: 460, damping: 36 }} />}
                  <span className="relative">{l}</span>
                </button>
              ))}
            </div>
          </Reveal>
          <CashFlowBars series={series} />
        </Panel>

        <Panel at={0.25} contentAt={0.36} className="p-[22px]">
          <Reveal>
            <CardTitle>Spending by category</CardTitle>
            <p className="mt-1 text-[12.5px] text-muted">From {state.transactions.filter((t) => t.direction === "out").length} outgoing payments</p>
          </Reveal>
          <Reveal at={0.05} className="mt-5 flex h-[12px] overflow-hidden rounded-full">
            {categories.map((c) => (
              <motion.span key={c.name} initial={{ width: 0 }} animate={{ width: `${c.share * 100}%` }} transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 }} style={{ background: c.color }} className="h-full" />
            ))}
          </Reveal>
          <ul className="mt-5 grid gap-2.5">
            {categories.map((c, i) => (
              <li key={c.name}>
                <Reveal at={0.08 + i * 0.04} className="flex items-center gap-3 text-[13px]">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c.color }} />
                  <span className="flex-1 text-ink-2">{c.name}</span>
                  <span className="num font-semibold">{whole(c.amount)}</span>
                  <span className="num w-[42px] text-right text-muted">{Math.round(c.share * 100)}%</span>
                </Reveal>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel at={0.3} contentAt={0.4} className="p-[22px]">
        <Reveal>
          <CardTitle>Statements</CardTitle>
        </Reveal>
        <ul className="mt-4 divide-y divide-line">
          {statements.map(([key, txs], i) => {
            const [y, m] = key.split("-").map(Number);
            const inSum = txs.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0);
            const outSum = txs.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0);
            return (
              <li key={key}>
                <Reveal at={0.04 + i * 0.05} className="flex flex-wrap items-center gap-4 py-3.5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-well text-ink-2">
                    <FileText size={16} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-[160px] flex-1">
                    <p className="text-[13.5px] font-semibold">
                      {MONTH_NAMES[m - 1]} {y} statement
                    </p>
                    <p className="text-[12px] text-muted">{txs.length} transactions</p>
                  </div>
                  <span className="num text-[13px] text-pos">+{whole(inSum)}</span>
                  <span className="num w-[110px] text-right text-[13px]">-{whole(outSum)}</span>
                  <Button
                    size="sm"
                    variant="soft"
                    icon={<Download size={14} strokeWidth={1.8} />}
                    onClick={() => {
                      downloadCsv(`71codes-statement-${key}.csv`, toCsv(txs));
                      toast({ title: `${MONTH_NAMES[m - 1]} ${y} statement downloaded` });
                    }}
                  >
                    CSV
                  </Button>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

function CashFlowBars({ series }: { series: { month: string; income: number; expenses: number }[] }) {
  const { delay, dur, still } = useTiming();
  const max = Math.max(...series.map((s) => s.income), 1);
  return (
    <div className="mt-6">
      <div className="flex h-[220px] items-end gap-3">
        {series.map((s, i) => (
          <div key={s.month} className="group flex h-full flex-1 flex-col items-center justify-end">
            <div className="flex h-full w-full items-end justify-center gap-[5px]">
              {[
                { v: s.income, cls: "bg-accent", label: "Income" },
                { v: s.expenses, cls: "bg-ink", label: "Expenses" },
              ].map((b, j) => (
                <motion.div
                  key={b.label}
                  title={`${s.month} ${b.label}: ${money(b.v, 0)}`}
                  className={cx("w-full max-w-[22px] rounded-[7px] transition-opacity group-hover:opacity-90", b.cls)}
                  initial={still ? false : { height: 0 }}
                  animate={{ height: `${(b.v / max) * 100}%` }}
                  transition={{ delay: delay(0.42 + i * 0.05 + j * 0.06), duration: dur(0.55), ease: EASE_OUT }}
                />
              ))}
            </div>
            <span className="mt-2 text-[11px] text-muted">{s.month}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-5 text-[12px] text-ink-2">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-accent" /> Income
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-ink" /> Expenses
        </span>
      </div>
    </div>
  );
}
