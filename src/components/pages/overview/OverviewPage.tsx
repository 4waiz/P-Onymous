"use client";

import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  CircleDollarSign,
  EllipsisVertical,
  ListFilter,
  ShoppingBag,
  Wallet as WalletIcon,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { HatchedProgress } from "@/components/charts/primitives";
import { ProfitLossChart } from "@/components/charts/ProfitLossChart";
import { RequestDialog, TransferDialog } from "@/components/flows/TransferDialog";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { EASE_OUT, useTiming } from "@/components/motion/timing";
import { NavLink, useNav } from "@/components/shell/nav";
import { Delta } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/fields";
import { Flag } from "@/components/ui/Flag";
import { Modal, Popover, useToast } from "@/components/ui/overlay";
import { Toggle } from "@/components/ui/Toggle";
import { WALLET_FLAGS } from "@/lib/data";
import { cx } from "@/lib/cx";
import { dayMonth, money, nowStamp } from "@/lib/format";
import { convert, useAppState, useDispatch } from "@/lib/store";
import type { DisplayCurrency, TxStatus } from "@/lib/types";
import { CardTitle, PageHeader } from "../PageHeader";
import { TxTable } from "../shared/TxTable";
import { OverviewWorldPanel } from "./OverviewWorldPanel";

export function OverviewPage() {
  const { profile } = useAppState();
  return (
    <div>
      <PageHeader
        title={`Good morning, ${profile.name}`}
        subtitle="Stay on top of your tasks, monitor progress, and track status."
        subtitleAt={0.62}
      />
      <OverviewWorldPanel />
      <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 xl:grid-cols-3">
        <BalanceCard />
        <MetricsCard />
        <IncomeCard />
        <div className="flex flex-col gap-[24px]">
          <SpendingLimitCard />
          <UpcomingBillsCard />
        </div>
        <RecentActivities />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Total Balance                                                      */
/* ------------------------------------------------------------------ */

function BalanceCard() {
  const state = useAppState();
  const dispatch = useDispatch();
  const currencyRef = useRef<HTMLButtonElement>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [walletsOpen, setWalletsOpen] = useState(false);
  const cur = state.currency;
  const format = useCallback((v: number) => money(v, 2, cur), [cur]);

  return (
    <Panel at={0.1} contentAt={0.35} className="flex h-[394px] flex-col px-[18px] pb-[17px] pt-[19px]">
      <Reveal className="flex h-[33px] items-center justify-between">
        <p className="text-[15px] tracking-[-0.01em] text-ink-2">Total Balance</p>
        <div className="relative">
          <button
            ref={currencyRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={currencyOpen}
            aria-label={`Display currency: ${cur}`}
            onClick={() => setCurrencyOpen((o) => !o)}
            className="flex h-[33px] items-center gap-[7px] rounded-full bg-card pl-[9px] pr-[10px] text-[12.5px] font-medium text-ink-2 ring-1 ring-inset ring-line transition-colors hover:bg-well"
          >
            <Flag code={WALLET_FLAGS[cur]} size={17} />
            {cur}
            <ChevronDown size={12} strokeWidth={2} className="text-muted" />
          </button>
          <Popover open={currencyOpen} onClose={() => setCurrencyOpen(false)} anchor={currencyRef} label="Choose currency" width={170}>
            <ul className="p-1.5" role="listbox" aria-label="Display currency">
              {(["USD", "EUR", "GBP"] as DisplayCurrency[]).map((c) => (
                <li key={c} role="option" aria-selected={c === cur}>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: "setCurrency", currency: c });
                      setCurrencyOpen(false);
                    }}
                    className={cx(
                      "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] hover:bg-well",
                      c === cur && "bg-well font-medium",
                    )}
                  >
                    <Flag code={WALLET_FLAGS[c]} size={18} /> {c}
                    <span className="ml-auto text-[11px] text-muted">{c === "USD" ? "1.00" : convert(1, c).toFixed(2)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Popover>
        </div>
      </Reveal>

      <Reveal at={0.02} className="mt-[11px]">
        <AnimatedNumber
          value={convert(state.balanceUSD, cur)}
          format={format}
          at={0.2}
          duration={1.2}
          className="block text-[30px] font-[650] leading-[36px] tracking-[-0.02em] text-ink"
        />
      </Reveal>
      <Reveal at={0.05} className="mt-[9px] flex items-center gap-[9px]">
        <Delta value={state.balanceDelta} />
        <span className="text-[12px] text-muted">than last month</span>
      </Reveal>

      <Reveal at={0.15} className="mt-[19px] grid grid-cols-2 gap-[16px]">
        <Button size="lg" icon={<ArrowLeftRight size={16} strokeWidth={1.9} />} onClick={() => setTransferOpen(true)}>
          Transfer
        </Button>
        <Button size="lg" variant="soft" icon={<ArrowLeftRight size={16} strokeWidth={1.9} />} onClick={() => setRequestOpen(true)}>
          Request
        </Button>
      </Reveal>

      <Reveal at={0.32} className="mt-[22px] flex-1 rounded-[18px] bg-well px-[13px] pb-[11px] pt-[12px]">
        <div className="flex items-center gap-[9px] text-[12.5px]">
          <span className="font-medium text-ink">Wallets</span>
          <span className="h-[12px] w-px bg-line-strong" aria-hidden />
          <button type="button" onClick={() => setWalletsOpen(true)} className="text-muted hover:text-ink hover:underline">
            Total {state.wallets.length} wallets
          </button>
        </div>
        <div className="mt-[12px] grid grid-cols-3 gap-[11px]">
          {state.wallets.slice(0, 3).map((w, i) => (
            <WalletMini key={w.id} walletId={w.id} at={0.4 + i * 0.06} />
          ))}
        </div>
      </Reveal>

      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} />
      <RequestDialog open={requestOpen} onClose={() => setRequestOpen(false)} />
      <WalletsDialog open={walletsOpen} onClose={() => setWalletsOpen(false)} />
    </Panel>
  );
}

function WalletMini({ walletId, at }: { walletId: string; at: number }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const w = state.wallets.find((x) => x.id === walletId)!;
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const fmt = useCallback((v: number) => money(v, 2, w.code), [w.code]);
  return (
    <Reveal at={at} y={8} className="rounded-[14px] bg-card px-[10px] pb-[9px] pt-[10px] shadow-card">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-[6px] text-[12px] font-medium text-ink-2">
          <Flag code={WALLET_FLAGS[w.code]} size={16} /> {w.code}
        </span>
        <div className="relative">
          <button
            ref={ref}
            type="button"
            aria-label={`${w.code} wallet options`}
            onClick={() => setOpen((o) => !o)}
            className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-2 hover:bg-well hover:text-ink"
          >
            <EllipsisVertical size={12} strokeWidth={2} />
          </button>
          <Popover open={open} onClose={() => setOpen(false)} anchor={ref} label={`${w.code} wallet`} width={180}>
            <div className="p-1.5">
              <button
                type="button"
                className="w-full rounded-[10px] px-3 py-2 text-left text-[13px] hover:bg-well"
                onClick={() => {
                  dispatch({ type: "toggleWallet", id: w.id });
                  setOpen(false);
                  toast({ title: `${w.code} wallet ${w.active ? "deactivated" : "activated"}` });
                }}
              >
                {w.active ? "Deactivate wallet" : "Activate wallet"}
              </button>
            </div>
          </Popover>
        </div>
      </div>
      <AnimatedNumber
        value={w.balance}
        format={fmt}
        at={at + 0.05}
        duration={1.1}
        className="mt-[9px] block truncate text-[12.5px] font-semibold tracking-[-0.01em] text-ink"
      />
      <p className="mt-[2px] truncate text-[8.5px] text-muted-2">Limit {money(w.limit, 0, w.code)} a month</p>
      <p className={cx("mt-[9px] text-[10.5px] font-medium", w.active ? "text-pos" : "text-neg")}>
        {w.active ? "Active" : "Inactive"}
      </p>
    </Reveal>
  );
}

function WalletsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  return (
    <Modal open={open} onClose={onClose} title="Wallets" description={`${state.wallets.length} currency wallets · demo balances`} width={440}>
      <ul className="grid gap-2">
        {state.wallets.map((w) => (
          <li key={w.id} className="flex items-center gap-3 rounded-[16px] bg-well px-4 py-3">
            <Flag code={WALLET_FLAGS[w.code]} size={28} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">{w.code}</p>
              <p className="num text-[13px] text-muted">{money(w.balance, 2, w.code)}</p>
            </div>
            <span className={cx("text-[12px] font-medium", w.active ? "text-pos" : "text-neg")}>{w.active ? "Active" : "Inactive"}</span>
            <Toggle checked={w.active} onChange={() => dispatch({ type: "toggleWallet", id: w.id })} label={`${w.code} wallet active`} />
          </li>
        ))}
      </ul>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  2 × 2 metric tiles                                                 */
/* ------------------------------------------------------------------ */

const whole = (v: number) => money(v, 0);

function MetricsCard() {
  const { stats } = useAppState();
  return (
    <Panel at={0.15} contentAt={0.3} className="grid h-[394px] grid-cols-2 grid-rows-2 gap-[17px] p-[16px]">
      <EarningsTile value={stats.earnings} />
      <MetricTile label="Total Spending" value={stats.spending} delta={-5} icon={<ShoppingBag size={13} strokeWidth={1.8} />} at={0.1} countAt={0.45} />
      <MetricTile label="Total Income" value={stats.income} delta={8} icon={<BriefcaseBusiness size={13} strokeWidth={1.8} />} at={0.15} countAt={0.55} />
      <MetricTile label="Total Revenue" value={stats.revenue} delta={4} icon={<CircleDollarSign size={13} strokeWidth={1.8} />} at={0.2} countAt={0.65} />
    </Panel>
  );
}

function TileShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cx("relative flex flex-col overflow-hidden px-[17px] pb-[16px] pt-[15px]", className)}
    >
      {children}
    </motion.div>
  );
}

function MetricTile({
  label,
  value,
  delta,
  icon,
  at,
  countAt,
}: {
  label: string;
  value: number;
  delta: number;
  icon: ReactNode;
  at: number;
  countAt: number;
}) {
  return (
    <TileShell className="rounded-[18px] bg-well">
      <Reveal at={at} className="flex h-[28px] items-center justify-between">
        <span className="text-[12px] tracking-[-0.005em] text-ink-2">{label}</span>
        <span className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full bg-well-strong text-ink-2">{icon}</span>
      </Reveal>
      <Reveal at={at + 0.03} className="mt-[30px]">
        <AnimatedNumber value={value} format={whole} at={countAt} duration={1.1} className="block text-[32px] font-[650] leading-[40px] tracking-[-0.025em] text-ink" />
      </Reveal>
      <Reveal at={at + 0.06} className="mt-auto flex items-center gap-[9px]">
        <Delta value={delta} />
        <span className="text-[12px] text-muted">This month</span>
      </Reveal>
    </TileShell>
  );
}

/** Coral tile revealed by a circular wipe from its top-left corner (0.9–1.1s in the film). */
function EarningsTile({ value }: { value: number }) {
  const { delay, dur, still } = useTiming();
  return (
    <TileShell className="rounded-[22px] bg-well">
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-[22px]"
        style={{
          background: "linear-gradient(150deg, #F47C55 0%, #EE6239 45%, #E24D25 100%)",
          boxShadow: "0 16px 28px -14px rgba(234, 85, 47, 0.6)",
        }}
        initial={still ? false : { clipPath: "circle(0% at 0% 0%)" }}
        animate={{ clipPath: "circle(150% at 0% 0%)" }}
        transition={{ delay: delay(0.25), duration: dur(0.45), ease: EASE_OUT }}
      />
      <Reveal at={0.3} className="relative flex h-[28px] items-center justify-between">
        <span className="text-[12px] tracking-[-0.005em] text-white/85">Total Earnings</span>
        <span className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white/20 text-white">
          <WalletIcon size={13} strokeWidth={1.8} />
        </span>
      </Reveal>
      <Reveal at={0.33} className="relative mt-[30px]">
        <AnimatedNumber value={value} format={whole} at={0.4} duration={1.1} className="block text-[32px] font-[650] leading-[40px] tracking-[-0.025em] text-white" />
      </Reveal>
      <Reveal at={0.36} className="relative mt-auto flex items-center gap-[9px]">
        <Delta value={7} onDark />
        <span className="text-[12px] text-white/75">This month</span>
      </Reveal>
    </TileShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Total Income · Profit and Loss                                     */
/* ------------------------------------------------------------------ */

function IncomeCard() {
  const { pnl } = useAppState();
  return (
    <Panel at={0.25} contentAt={0.32} className="flex h-[394px] flex-col px-[17px] pb-[14px] pt-[25px] md:col-span-2 xl:col-span-1">
      <Reveal>
        <CardTitle>Total Income</CardTitle>
        <p className="mt-[7px] text-[12.5px] text-muted">View your income in a certain period of time</p>
      </Reveal>
      <Reveal at={0.02} y={6} blur={2} className="mt-[17px] flex min-h-0 flex-1 flex-col rounded-[16px] bg-well px-[16px] pb-[14px] pt-[15px]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold tracking-[-0.01em] text-ink">Profit and Loss</p>
          <div className="flex items-center gap-[14px] text-[11.5px] text-ink-2">
            <span className="flex items-center gap-[6px]">
              <span className="h-[9px] w-[9px] rounded-[3px] bg-accent" aria-hidden /> Profit
            </span>
            <span className="flex items-center gap-[6px]">
              <span className="h-[9px] w-[9px] rounded-[3px] bg-ink" aria-hidden /> Loss
            </span>
          </div>
        </div>
        <div className="mt-[17px] min-h-0 flex-1">
          <ProfitLossChart data={pnl} at={0.08} />
        </div>
      </Reveal>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  Row 2                                                              */
/* ------------------------------------------------------------------ */

function SpendingLimitCard() {
  const { cards } = useAppState();
  const card = cards[0];
  const format = useCallback((v: number) => money(v, 2), []);
  return (
    <Panel at={0.3} contentAt={0.45} className="h-[136px] px-[20px] pt-[24px]">
      <NavLink href="/manage" className="block rounded-[12px] outline-none" aria-label="Monthly spending limit — manage card limits">
        <Reveal>
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Monthly Spending Limit</p>
        </Reveal>
        <div className="mt-[22px]">
          <HatchedProgress value={(card.spent / card.limit) * 100} at={0.1} height={11} label="Spent of monthly limit" />
        </div>
        <Reveal at={0.08} className="mt-[13px] flex items-baseline justify-between text-[12px]">
          <span>
            <AnimatedNumber value={card.spent} format={format} at={0.1} duration={1.1} className="font-semibold text-ink" />{" "}
            <span className="text-[10px] text-muted">spent out of</span>
          </span>
          <span className="num font-semibold text-ink">{money(card.limit)}</span>
        </Reveal>
      </NavLink>
    </Panel>
  );
}

function UpcomingBillsCard() {
  const { bills } = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const upcoming = bills.filter((b) => !b.paid).slice(0, 3);
  return (
    <Panel at={0.38} contentAt={0.6} className="px-[20px] pb-[16px] pt-[20px]">
      <Reveal className="flex items-center justify-between">
        <p className="text-[15px] font-semibold tracking-[-0.01em]">Upcoming bills</p>
        <NavLink href="/schedule" className="text-[12px] text-muted hover:text-ink">
          See all
        </NavLink>
      </Reveal>
      <ul className="mt-3 grid gap-1">
        {upcoming.length === 0 && <li className="py-4 text-[12.5px] text-muted">All bills are paid. Nice.</li>}
        {upcoming.map((b, i) => (
          <li key={b.id}>
            <Reveal at={0.05 + i * 0.05} y={6} className="flex items-center gap-3 rounded-[12px] py-2">
              <span className="flex h-9 w-9 flex-col items-center justify-center rounded-[10px] bg-well text-[9px] leading-tight text-muted">
                <span className="text-[13px] font-semibold text-ink">{Number(b.due.slice(8, 10))}</span>
                {dayMonth(b.due).split(" ")[1]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{b.name}</p>
                <p className="text-[11.5px] text-muted">{b.autopay ? "Autopay on" : b.category}</p>
              </div>
              <span className="num text-[13px] font-semibold">{money(b.amount)}</span>
              <Button
                size="xs"
                variant="soft"
                onClick={() => {
                  dispatch({ type: "payBill", id: b.id, at: nowStamp() });
                  toast({ title: `Paid ${b.name}`, description: money(b.amount) });
                }}
              >
                Pay
              </Button>
            </Reveal>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const STATUSES: TxStatus[] = ["Completed", "Pending", "In Progress"];

function RecentActivities() {
  const { transactions } = useAppState();
  const { navigate } = useNav();
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<Set<TxStatus>>(new Set(STATUSES));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const filterRef = useRef<HTMLButtonElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => statuses.has(t.status))
      .filter((t) => !q || `${t.id} ${t.title}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [transactions, query, statuses]);

  const filtered = statuses.size < STATUSES.length;

  return (
    <Panel at={0.35} contentAt={0.45} className="flex flex-col px-[19px] pb-[12px] pt-[22px] md:col-span-1 xl:col-span-2">
      <Reveal className="flex flex-wrap items-center gap-3">
        <CardTitle className="mr-auto">Recent Activities</CardTitle>
        <SearchInput
          label="Search activities"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          wrapperClassName="w-[244px] max-w-full"
        />
        <div className="relative mr-[5px]">
          <Button
            ref={filterRef}
            variant="outline"
            className="h-[44px] w-[94px] px-0 text-[14px] font-normal"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((o) => !o)}
            iconRight={
              <span className="relative">
                <ListFilter size={15} strokeWidth={1.8} />
                {filtered && <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-accent" />}
              </span>
            }
          >
            Filter
          </Button>
          <Popover open={filterOpen} onClose={() => setFilterOpen(false)} anchor={filterRef} label="Filter activities" width={210}>
            <fieldset className="p-3">
              <legend className="px-1 pb-2 text-[12px] font-medium text-muted">Status</legend>
              {STATUSES.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2.5 rounded-[10px] px-2 py-2 text-[13px] hover:bg-well">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--accent)]"
                    checked={statuses.has(s)}
                    onChange={(e) => {
                      const next = new Set(statuses);
                      if (e.target.checked) next.add(s);
                      else next.delete(s);
                      setStatuses(next);
                    }}
                  />
                  {s}
                </label>
              ))}
              <button
                type="button"
                className="mt-1 w-full rounded-[10px] px-2 py-2 text-left text-[12.5px] text-accent hover:bg-well"
                onClick={() => setStatuses(new Set(STATUSES))}
              >
                Reset filters
              </button>
            </fieldset>
          </Popover>
        </div>
      </Reveal>
      <Reveal at={0.06} y={6} className="mt-[23px]">
        <TxTable rows={rows} at={0.12} selected={selected} onSelectedChange={setSelected} emptyLabel="No activity matches your search." />
      </Reveal>
      <Reveal at={0.4} className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => navigate("/activity")}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium text-ink-2 hover:bg-well hover:text-ink"
        >
          View all activity <ArrowRight size={14} strokeWidth={1.8} />
        </button>
      </Reveal>
    </Panel>
  );
}
