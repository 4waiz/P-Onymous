"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Check, Copy, Ellipsis, Eye } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, Popover, useToast } from "@/components/ui/overlay";
import { cx } from "@/lib/cx";
import { dateTime, money } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { TxGlyph } from "./TxGlyph";

export type SortKey = "price" | "date";

export function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx(
        "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] transition-colors",
        checked || indeterminate ? "bg-pill text-pill-fg" : "bg-card ring-1 ring-inset ring-line-strong hover:ring-muted-2",
      )}
    >
      {checked && <Check size={12} strokeWidth={3} />}
      {!checked && indeterminate && <span className="h-[2px] w-2 rounded bg-pill-fg" />}
    </button>
  );
}

/**
 * Transactions table shared by Overview “Recent Activities” and the Activity page.
 * Rounded pale header row, understated row dividers, checkbox column and a row menu.
 */
export function TxTable({
  rows,
  at = 0,
  selected,
  onSelectedChange,
  sort,
  onSort,
  emptyLabel = "No transactions match.",
  cols = [69, 97, 175, 80, 108],
}: {
  rows: Transaction[];
  at?: number;
  selected: Set<string>;
  onSelectedChange: (s: Set<string>) => void;
  sort?: { key: SortKey; dir: "asc" | "desc" } | null;
  onSort?: (key: SortKey) => void;
  emptyLabel?: string;
  /** Widths of the checkbox, Order ID, Activity, Price and Status columns (Date takes the rest). */
  cols?: number[];
}) {
  const [detail, setDetail] = useState<Transaction | null>(null);
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someChecked = rows.some((r) => selected.has(r.id));

  const toggle = (id: string, v: boolean) => {
    const next = new Set(selected);
    if (v) next.add(id);
    else next.delete(id);
    onSelectedChange(next);
  };

  const sortBtn = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => onSort?.(key)}
      className="inline-flex items-center gap-1 hover:text-ink"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <ArrowUpDown size={11} strokeWidth={1.8} className={cx(sort?.key === key ? "text-ink" : "text-muted-2")} />
    </button>
  );

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-0 text-left">
        <colgroup>
          {cols.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
          <col />
          <col style={{ width: 44 }} />
        </colgroup>
        <thead>
          <tr className="text-[13.5px] text-muted">
            <th className="h-[54px] rounded-l-[14px] bg-inset pl-[22px] font-normal">
              <Checkbox
                checked={allChecked}
                indeterminate={!allChecked && someChecked}
                label="Select all rows"
                onChange={(v) => onSelectedChange(v ? new Set(rows.map((r) => r.id)) : new Set())}
              />
            </th>
            <th className="h-[54px] bg-inset font-normal">Order ID</th>
            <th className="h-[54px] bg-inset font-normal">Activity</th>
            <th className="h-[54px] bg-inset font-normal">{onSort ? sortBtn("price", "Price") : "Price"}</th>
            <th className="h-[54px] bg-inset font-normal">Status</th>
            <th className="h-[54px] bg-inset font-normal">{onSort ? sortBtn("date", "Date") : "Date"}</th>
            <th className="h-[54px] rounded-r-[14px] bg-inset font-normal">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((r, i) => (
              <motion.tr
                key={r.id}
                layout="position"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="group text-[13.5px] text-ink"
              >
                <Cell at={at + i * 0.05} className="pl-[22px]">
                  <Checkbox checked={selected.has(r.id)} onChange={(v) => toggle(r.id, v)} label={`Select ${r.id}`} />
                </Cell>
                <Cell at={at + i * 0.05} className="truncate whitespace-nowrap pr-2 text-ink-2">
                  {r.id}
                </Cell>
                <Cell at={at + i * 0.05} className="pr-3">
                  <span className="flex min-w-0 items-center gap-[9px]">
                    <TxGlyph icon={r.icon} size={18} />
                    <span className="truncate">{r.title}</span>
                  </span>
                </Cell>
                <Cell at={at + i * 0.05} className={cx("num whitespace-nowrap", r.direction === "in" && "text-pos")}>
                  {r.direction === "in" ? "+" : ""}
                  {money(r.amount, r.amount % 1 ? 2 : 0)}
                </Cell>
                <Cell at={at + i * 0.05} className="whitespace-nowrap">
                  <StatusDot status={r.status} />
                </Cell>
                <Cell at={at + i * 0.05} className="truncate whitespace-nowrap text-ink-2">
                  {dateTime(r.at)}
                </Cell>
                <Cell at={at + i * 0.05} className="pr-2">
                  <RowMenu tx={r} onView={() => setDetail(r)} />
                </Cell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-10 text-center text-[13px] text-muted">{emptyLabel}</p>}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ""} description={detail?.id} width={420}>
        {detail && (
          <div>
            <div className="flex items-center gap-3 rounded-[18px] bg-inset p-4">
              <TxGlyph icon={detail.icon} size={40} />
              <div>
                <p className={cx("num text-[24px] font-semibold tracking-[-0.02em]", detail.direction === "in" && "text-pos")}>
                  {detail.direction === "in" ? "+" : "-"}
                  {money(detail.amount)}
                </p>
                <StatusDot status={detail.status} />
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-y-2.5 text-[13px]">
              <dt className="text-muted">Invoice</dt>
              <dd className="text-right">{detail.id}</dd>
              <dt className="text-muted">Date</dt>
              <dd className="text-right">{dateTime(detail.at)}</dd>
              <dt className="text-muted">Direction</dt>
              <dd className="text-right">{detail.direction === "in" ? "Incoming" : "Outgoing"}</dd>
              {detail.counterparty && (
                <>
                  <dt className="text-muted">Counterparty</dt>
                  <dd className="text-right">{detail.counterparty}</dd>
                </>
              )}
            </dl>
            <Button className="mt-6 w-full" variant="soft" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Cell({ at, className, children }: { at: number; className?: string; children: ReactNode }) {
  return (
    <td className={cx("h-[54px] border-b border-line", className)}>
      <Reveal at={at} y={6} blur={4}>
        {children}
      </Reveal>
    </td>
  );
}

function RowMenu({ tx, onView }: { tx: Transaction; onView: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const toast = useToast();
  return (
    <div className="relative flex justify-end">
      <button
        ref={ref}
        type="button"
        aria-label={`Actions for ${tx.id}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-inset hover:text-ink"
      >
        <Ellipsis size={16} strokeWidth={1.8} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={ref} label={`${tx.id} actions`} width={190}>
        <div className="p-1.5">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-[13px] hover:bg-inset"
            onClick={() => {
              setOpen(false);
              onView();
            }}
          >
            <Eye size={15} strokeWidth={1.8} /> View details
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-[13px] hover:bg-inset"
            onClick={async () => {
              setOpen(false);
              try {
                await navigator.clipboard.writeText(tx.id);
                toast({ title: "Invoice ID copied", description: tx.id });
              } catch {
                toast({ title: "Couldn’t access the clipboard", tone: "error" });
              }
            }}
          >
            <Copy size={15} strokeWidth={1.8} /> Copy invoice ID
          </button>
        </div>
      </Popover>
    </div>
  );
}

export function toCsv(rows: Transaction[]) {
  const head = ["Order ID", "Activity", "Direction", "Amount", "Status", "Date"];
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.id, r.title, r.direction, r.amount.toFixed(2), r.status, dateTime(r.at)].map((v) => esc(String(v))).join(","),
  );
  return [head.join(","), ...lines].join("\n");
}

export function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
