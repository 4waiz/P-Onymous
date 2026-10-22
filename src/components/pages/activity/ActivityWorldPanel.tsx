"use client";

import { ArrowDownLeft, ArrowUpRight, Clock3, Landmark, Store } from "lucide-react";
import { useCallback, useMemo } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { MERCHANTS, merchantFor } from "@/components/world/scenes/data";
import { WorldPanel, type WorldFocusSpec } from "@/components/world/WorldPanel";
import { money } from "@/lib/format";
import { useAppState } from "@/lib/store";

const whole = (v: number) => money(v, 0);

/** Money in motion: the vault, every merchant you paid, the client that paid you. */
export function ActivityWorldPanel() {
  const { transactions, balanceUSD } = useAppState();
  const stats = useMemo(() => {
    const inflow = transactions.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0);
    const outflow = transactions.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0);
    const waiting = transactions.filter((t) => t.status !== "Completed");
    return { inflow, outflow, waiting };
  }, [transactions]);
  const latest = transactions[0];
  const latestAnchor = latest ? merchantFor(latest.icon) : "hub";

  const focus = useCallback(
    (id: string): WorldFocusSpec | null => {
      if (id === "hub") {
        return {
          title: "71Codes vault",
          tone: "coral",
          icon: <Landmark size={18} strokeWidth={1.8} />,
          rows: [
            ["Balance", money(balanceUSD, 0)],
            ["Money in", money(stats.inflow, 0)],
            ["Money out", money(stats.outflow, 0)],
          ],
        };
      }
      if (id === "checkpoint") {
        return {
          title: "Awaiting",
          tone: "amber",
          icon: <Clock3 size={18} strokeWidth={1.8} />,
          rows: [
            ["Payments", String(stats.waiting.length)],
            ["On hold", money(stats.waiting.reduce((s, t) => s + t.amount, 0), 0)],
            ["Oldest", stats.waiting.at(-1)?.title ?? "—"],
          ],
        };
      }
      const m = MERCHANTS[id];
      if (!m) return null;
      const txs = transactions.filter((t) => merchantFor(t.icon) === id);
      const incoming = id === "client";
      return {
        title: m.label,
        tone: incoming ? "green" : "blue",
        icon: incoming ? <ArrowDownLeft size={18} strokeWidth={1.8} /> : <Store size={18} strokeWidth={1.8} />,
        rows: [
          [incoming ? "Received" : "Spent", money(txs.reduce((s, t) => s + t.amount, 0), 0)],
          ["Payments", String(txs.length)],
          ["Latest", txs[0]?.title ?? "—"],
        ],
      };
    },
    [balanceUSD, stats, transactions],
  );

  return (
    <WorldPanel
      scene="activity"
      eyebrow="Money in motion"
      at={0.08}
      focus={focus}
      cards={[
        { id: "in", anchor: "client", side: "left", tone: "green", label: "Money in", value: <AnimatedNumber value={stats.inflow} format={whole} at={0.3} /> },
        { id: "out", anchor: "hub", side: "left", tone: "coral", label: "Money out", value: <AnimatedNumber value={stats.outflow} format={whole} at={0.35} /> },
        { id: "wait", anchor: "checkpoint", side: "right", tone: "amber", label: "Awaiting", value: `${stats.waiting.length} payments` },
        {
          id: "latest",
          anchor: latestAnchor,
          side: "right",
          tone: latest?.direction === "in" ? "green" : "blue",
          label: "Latest",
          value: (
            <span className="flex items-center gap-1 text-[15px]">
              {latest?.direction === "in" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
              <span className="max-w-[118px] truncate">{latest?.title ?? "—"}</span>
            </span>
          ),
        },
      ]}
    />
  );
}
