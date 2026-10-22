"use client";

import { ArrowRight, FileText, Search, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/overlay";
import { cx } from "@/lib/cx";
import { money } from "@/lib/format";
import { useAppState } from "@/lib/store";
import { RAIL_NAV, TOP_NAV, useNav } from "./nav";

interface Result {
  id: string;
  label: string;
  hint: string;
  href: string;
  kind: "page" | "contact" | "tx";
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const state = useAppState();
  const { navigate } = useNav();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const pages: Result[] = [
      ...TOP_NAV.map((p) => ({ id: `p-${p.href}`, label: p.label, hint: "Page", href: p.href, kind: "page" as const })),
      ...RAIL_NAV.filter((r) => !TOP_NAV.some((t) => t.href === r.href)).map((r) => ({
        id: `r-${r.href}`,
        label: r.label,
        hint: "Page",
        href: r.href,
        kind: "page" as const,
      })),
    ];
    const contacts: Result[] = state.contacts.map((c) => ({
      id: c.id,
      label: c.name,
      hint: `${c.kind} · ${c.handle}`,
      href: "/contacts",
      kind: "contact",
    }));
    const txs: Result[] = state.transactions.map((t) => ({
      id: t.id,
      label: t.title,
      hint: `${t.id} · ${money(t.amount, 0)}`,
      href: "/activity",
      kind: "tx",
    }));
    const all = [...pages, ...contacts, ...txs];
    if (!q) return pages;
    return all.filter((r) => `${r.label} ${r.hint}`.toLowerCase().includes(q)).slice(0, 12);
  }, [query, state.contacts, state.transactions]);

  const close = () => {
    onOpenChange(false);
    setQuery("");
    setCursor(0);
  };
  const go = (r: Result) => {
    close();
    navigate(r.href);
  };

  return (
    <Modal open={open} onClose={close} title="Search 71Codes" width={560}>
      <label className="flex h-[50px] items-center gap-3 rounded-[16px] bg-inset px-4">
        <Search size={18} strokeWidth={1.8} className="text-muted" aria-hidden />
        <span className="sr-only">Search query</span>
        <input
          data-autofocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter" && results[cursor]) {
              go(results[cursor]);
            }
          }}
          placeholder="Pages, contacts, invoices…"
          className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-2"
        />
      </label>
      <ul className="mt-3 max-h-[320px] overflow-y-auto v-scroll" role="listbox" aria-label="Results">
        {results.length === 0 && <li className="py-10 text-center text-[13px] text-muted">No matches for “{query}”.</li>}
        {results.map((r, i) => {
          const Icon = r.kind === "contact" ? User : r.kind === "tx" ? FileText : ArrowRight;
          return (
            <li key={r.id} role="option" aria-selected={i === cursor}>
              <button
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r)}
                className={cx(
                  "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors",
                  i === cursor ? "bg-inset" : "hover:bg-inset",
                )}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-card text-ink-2 shadow-card">
                  <Icon size={15} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{r.label}</span>
                  <span className="block truncate text-[12px] text-muted">{r.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
