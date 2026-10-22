"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowLeftRight, ArrowUpRight, Clock3, Download, ReceiptText } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { RequestDialog, TransferDialog } from "@/components/flows/TransferDialog";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { Delta } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/overlay";
import { cx } from "@/lib/cx";
import { dateTime, int, money } from "@/lib/format";
import { useAppState } from "@/lib/store";
import type { Transaction, TxStatus } from "@/lib/types";
import { CardTitle, PageHeader } from "../PageHeader";
import { TxGlyph } from "../shared/TxGlyph";
import { downloadCsv, toCsv, TxTable, type SortKey } from "../shared/TxTable";

type Tab = "All" | TxStatus;
const TABS: Tab[] = ["All", "Completed", "Pending", "In Progress"];
const PAGE = 8;

const whole = (v: number) => money(v, 0);
const count = (v: number) => int(v);

export function ActivityPage() {
  const { transactions } = useAppState();
  const toast = useToast();
  const [transferOpen, setTransferOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(PAGE);

  const stats = useMemo(() => {
    const inflow = transactions.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0);
    const outflow = transactions.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0);
    const waiting = transactions.filter((t) => t.status !== "Completed");
    return { inflow, outflow, waiting: waiting.length, held: waiting.reduce((s, t) => s + t.amount, 0) };
  }, [transactions]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { All: transactions.length, Completed: 0, Pending: 0, "In Progress": 0 };
    transactions.forEach((t) => (c[t.status] += 1));
    return c;
  }, [transactions]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = transactions
      .filter((t) => tab === "All" || t.status === tab)
      .filter((t) => !q || `${t.id} ${t.title} ${t.status}`.toLowerCase().includes(q));
    if (sort) {
      const dir = sort.dir === "asc" ? 1 : -1;
      list.sort((a, b) => (sort.key === "price" ? a.amount - b.amount : a.at.localeCompare(b.at)) * dir);
    }
    return list;
  }, [transactions, tab, query, sort]);

  const onSort = useCallback((key: SortKey) => {
    setSort((s) => (s?.key === key ? (s.dir === "desc" ? { key, dir: "asc" } : null) : { key, dir: "desc" }));
  }, []);

  const exportCsv = () => {
    const chosen = selected.size ? rows.filter((r) => selected.has(r.id)) : rows;
    downloadCsv(`71codes-activity-${tab.toLowerCase().replace(/\s/g, "-")}.csv`, toCsv(chosen));
    toast({ title: `Exported ${chosen.length} transactions`, description: "Saved as CSV" });
  };

  return (
    <div>
      <PageHeader
        title="Activity"
        subtitle="Every payment, transfer and request — searchable, sortable, all in one place."
        subtitleAt={0.25}
        actionsAt={0.28}
        actions={
          <>
            <Button variant="ghost" size="lg" className="h-[47px] px-[18px] text-[14.5px]" icon={<ArrowDown size={15} strokeWidth={1.9} />} onClick={() => setRequestOpen(true)}>
              Request
            </Button>
            <Button size="lg" className="h-[47px] px-[24px] text-[14.5px]" icon={<ArrowLeftRight size={15} strokeWidth={1.9} />} onClick={() => setTransferOpen(true)}>
              New transfer
            </Button>
          </>
        }
      />

      <div className="mb-[24px] grid grid-cols-1 gap-[24px] sm:grid-cols-2 xl:grid-cols-4">
        <StatCard at={0.08} label="Transactions" icon={<ReceiptText size={14} strokeWidth={1.8} />} tone="neutral" value={transactions.length} format={count} foot={<><Delta value={12} /><span>vs March</span></>} />
        <StatCard at={0.12} label="Money in" icon={<ArrowDown size={14} strokeWidth={1.9} />} tone="pos" value={stats.inflow} format={whole} foot={<><Delta value={8} /><span>This month</span></>} />
        <StatCard at={0.16} label="Money out" icon={<ArrowUpRight size={14} strokeWidth={1.9} />} tone="neg" value={stats.outflow} format={whole} foot={<><Delta value={-5} /><span>This month</span></>} />
        <StatCard at={0.2} label="Awaiting" icon={<Clock3 size={14} strokeWidth={1.9} />} tone="warn" value={stats.waiting} format={count} foot={<span>{money(stats.held, 0)} on hold</span>} />
      </div>

      <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-[minmax(0,1fr)_332px]">
        <Panel at={0.22} contentAt={0.32} className="px-[22px] pb-[18px] pt-[22px]">
          <Reveal className="inline-flex h-[40px] items-center gap-[4px] rounded-full bg-well p-[4px]" role="tablist" aria-label="Filter by status">
            {TABS.map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(t);
                    setLimit(PAGE);
                  }}
                  className={cx("relative flex h-[32px] items-center gap-[7px] rounded-full px-[14px] text-[12.5px] transition-colors", active ? "text-ink" : "text-muted hover:text-ink")}
                >
                  {active && <motion.span layoutId="activity-tab" className="absolute inset-0 rounded-full bg-card shadow-card" transition={{ type: "spring", stiffness: 460, damping: 36 }} />}
                  <span className="relative">{t}</span>
                  <span className={cx("relative inline-flex h-[17px] min-w-[19px] items-center justify-center rounded-full px-1 text-[10px] font-medium", active ? "bg-pill text-pill-fg" : "bg-well-strong text-muted")}>
                    {counts[t]}
                  </span>
                </button>
              );
            })}
          </Reveal>
          <Reveal at={0.05} className="mt-[15px] flex flex-wrap items-center justify-end gap-[15px]">
            {selected.size > 0 && <span className="mr-auto text-[12.5px] text-muted">{selected.size} selected</span>}
            <SearchInput label="Search transactions" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} wrapperClassName="w-[258px] max-w-full" />
            <Button variant="outline" className="h-[44px] px-[18px] text-[14px] font-normal" iconRight={<Download size={15} strokeWidth={1.8} />} onClick={exportCsv}>
              Export
            </Button>
          </Reveal>
          <Reveal at={0.08} y={6} className="mt-[24px]">
            <TxTable
              rows={rows.slice(0, limit)}
              at={0.12}
              selected={selected}
              onSelectedChange={setSelected}
              sort={sort}
              onSort={onSort}
              cols={[68, 104, 187, 85, 117]}
              emptyLabel="No transactions in this view."
            />
          </Reveal>
          {rows.length > limit && (
            <div className="mt-4 flex justify-center">
              <Button variant="soft" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
                Show {Math.min(PAGE, rows.length - limit)} more
              </Button>
            </div>
          )}
        </Panel>

        <LiveFeed items={transactions.slice(0, 7)} />
      </div>

      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} />
      <RequestDialog open={requestOpen} onClose={() => setRequestOpen(false)} />
    </div>
  );
}

function StatCard({
  at,
  label,
  icon,
  tone,
  value,
  format,
  foot,
}: {
  at: number;
  label: string;
  icon: ReactNode;
  tone: "neutral" | "pos" | "neg" | "warn";
  value: number;
  format: (v: number) => string;
  foot: ReactNode;
}) {
  const tones = { neutral: "bg-well text-ink-2", pos: "bg-pos-bg text-pos", neg: "bg-neg-bg text-neg", warn: "bg-warn-bg text-warn" };
  return (
    <Panel at={at} contentAt={at + 0.12} className="h-[159px] px-[20px] pb-[20px] pt-[21px]">
      <Reveal className="flex items-center gap-[12px]">
        <span className={cx("inline-flex h-[34px] w-[34px] items-center justify-center rounded-full", tones[tone])}>{icon}</span>
        <span className="text-[13.5px] text-ink-2">{label}</span>
      </Reveal>
      <Reveal at={0.03} className="mt-[16px]">
        <AnimatedNumber value={value} format={format} at={0.08} duration={1.2} className="block text-[30px] font-[650] leading-[36px] tracking-[-0.025em] text-ink" />
      </Reveal>
      <Reveal at={0.06} className="mt-[14px] flex items-center gap-[9px] text-[11.5px] text-muted">
        {foot}
      </Reveal>
    </Panel>
  );
}

function LiveFeed({ items }: { items: Transaction[] }) {
  const dot = (s: TxStatus) => (s === "Completed" ? "bg-pos" : s === "Pending" ? "bg-neg" : "bg-warn");
  return (
    <Panel at={0.26} contentAt={0.36} className="px-[20px] pb-[16px] pt-[24px]">
      <Reveal className="flex items-center justify-between">
        <CardTitle>Live feed</CardTitle>
        <span className="flex items-center gap-[6px] text-[11px] text-pos">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute inset-0 animate-ping rounded-full bg-pos opacity-50" />
            <span className="relative h-[7px] w-[7px] rounded-full bg-pos" />
          </span>
          Live
        </span>
      </Reveal>
      <ol className="relative mt-[18px]" aria-label="Latest transactions">
        <span aria-hidden className="absolute bottom-3 left-[2.5px] top-3 w-px bg-line" />
        <AnimatePresence initial={false}>
          {items.map((t, i) => (
            <motion.li
              key={t.id}
              layout
              initial={{ opacity: 0, x: -10, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Reveal at={0.04 + i * 0.06} y={6} className="relative flex items-center gap-[14px] py-[10px]">
                <span className={cx("relative z-10 h-[6px] w-[6px] shrink-0 rounded-full ring-[3px] ring-card", dot(t.status))} />
                <TxGlyph icon={t.icon} size={31} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold leading-[17px] tracking-[-0.01em] text-ink">{t.title}</p>
                  <p className="mt-[2px] truncate text-[10.5px] leading-[14px] text-muted-2">{dateTime(t.at)}</p>
                </div>
                <span className={cx("num shrink-0 text-[12.5px] font-semibold", t.direction === "in" ? "text-pos" : "text-ink")}>
                  {t.direction === "in" ? "+" : "-"}
                  {money(t.amount, t.amount % 1 ? 2 : 0)}
                </span>
              </Reveal>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </Panel>
  );
}
