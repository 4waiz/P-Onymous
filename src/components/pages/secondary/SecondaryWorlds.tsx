"use client";

import { Bell, CalendarClock, Crown, FileText, Gift, Mail, Moon, Receipt, ShieldCheck, Sun, TrendingUp } from "lucide-react";
import { useCallback, useMemo } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/overlay";
import { Toggle } from "@/components/ui/Toggle";
import { WorldChip } from "@/components/world/Tag";
import { WorldPanel, type WorldFocusSpec } from "@/components/world/WorldPanel";
import { dateTime, dayMonth, int, money, nowStamp } from "@/lib/format";
import { useAppState, useDispatch } from "@/lib/store";
import { setTheme, useTheme } from "@/lib/theme";

const whole = (v: number) => money(v, 0);

/* ------------------------------------------------------------------ */
/*  Reports — bar city                                                 */
/* ------------------------------------------------------------------ */

export function ReportsWorldPanel({ period }: { period: "6m" | "ytd" }) {
  const { pnl } = useAppState();
  const series = useMemo(() => {
    const data = pnl.map((m) => ({ month: m.month, income: m.loss + m.profit, expenses: m.loss }));
    return period === "6m" ? data.slice(-6) : data;
  }, [pnl, period]);
  const income = series.reduce((s, m) => s + m.income, 0);
  const expenses = series.reduce((s, m) => s + m.expenses, 0);
  const best = series.reduce((a, b) => (b.income - b.expenses > a.income - a.expenses ? b : a), series[0]);

  const focus = (id: string): WorldFocusSpec | null => {
      const m = series.find((s) => `month-${s.month}` === id);
      if (!m) return null;
      return {
        title: `${m.month} 2026`,
        tone: "coral",
        icon: <TrendingUp size={18} strokeWidth={1.8} />,
        rows: [
          ["Income", money(m.income, 0)],
          ["Expenses", money(m.expenses, 0)],
          ["Net", <span key="n" className="text-pos">{money(m.income - m.expenses, 0)}</span>],
        ],
      };
  };

  return (
    <WorldPanel
      scene="reports"
      sceneProps={{ period }}
      eyebrow="Cash-flow skyline"
      at={0.06}
      focus={focus}
      tags={series.map((s) => ({ id: `t-${s.month}`, anchor: `label-${s.month}`, content: <WorldChip>{s.month}</WorldChip> }))}
      cards={[
        { id: "inc", anchor: "income", side: "left", tone: "coral", label: "Income", value: <AnimatedNumber value={income} format={whole} at={0.3} /> },
        { id: "exp", anchor: "expenses", side: "left", tone: "ink", label: "Expenses", value: <AnimatedNumber value={expenses} format={whole} at={0.35} /> },
        { id: "net", anchor: "net", side: "right", tone: "green", label: "Net profit", value: <AnimatedNumber value={income - expenses} format={whole} at={0.4} /> },
        { id: "best", anchor: `month-${best.month}`, side: "right", tone: "amber", label: "Best month", value: `${best.month} · ${money(best.income - best.expenses, 0)}` },
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Schedule — bill street                                             */
/* ------------------------------------------------------------------ */

export function ScheduleWorldPanel() {
  const { bills, balanceUSD } = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const unpaid = bills.filter((b) => !b.paid).sort((a, b) => a.due.localeCompare(b.due));
  const next = unpaid[0];
  const autopay = bills.filter((b) => b.autopay).length;

  const focus = (id: string): WorldFocusSpec | null => {
      const b = bills.find((x) => `bill-${x.id}` === id);
      if (!b) return null;
      return {
        title: b.name,
        tone: b.paid ? "green" : "coral",
        icon: <Receipt size={18} strokeWidth={1.8} />,
        rows: [
          ["Amount", money(b.amount)],
          ["Due", dayMonth(b.due)],
          ["Status", b.paid ? "Paid" : b.autopay ? "Autopay" : "Due"],
        ],
        footer: b.paid ? undefined : (
          <Button
            size="sm"
            className="w-full"
            disabled={b.amount > balanceUSD}
            onClick={() => {
              dispatch({ type: "payBill", id: b.id, at: nowStamp() });
              toast({ title: `Paid ${b.name}`, description: money(b.amount) });
            }}
          >
            Pay {money(b.amount)}
          </Button>
        ),
      };
  };

  return (
    <WorldPanel
      scene="schedule"
      eyebrow="Bill street"
      at={0.06}
      focus={focus}
      tags={bills.map((b) => ({
        id: `t-${b.id}`,
        anchor: `bill-${b.id}`,
        content: (
          <WorldChip tone={b.paid ? "#1FB07B" : "#EA552F"}>
            {dayMonth(b.due)} · {money(b.amount, b.amount % 1 ? 2 : 0)}
          </WorldChip>
        ),
      }))}
      cards={[
        { id: "due", anchor: next ? `bill-${next.id}` : "payvan", side: "left", tone: "coral", label: "Due this month", value: <AnimatedNumber value={unpaid.reduce((s, b) => s + b.amount, 0)} format={(v) => money(v)} at={0.3} /> },
        { id: "auto", anchor: "payvan", side: "left", tone: "green", label: "On autopay", value: `${autopay} of ${bills.length}` },
        { id: "next", anchor: next ? `bill-${next.id}` : "payvan", side: "right", tone: "amber", label: "Next bill", value: <span className="block max-w-[150px] truncate text-[16px]">{next ? `${next.name.split(" ")[0]} · ${dayMonth(next.due)}` : "All paid ✓"}</span> },
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Inbox — mail room                                                  */
/* ------------------------------------------------------------------ */

export function InboxWorldPanel({ onOpen }: { onOpen: (messageId: string) => void }) {
  const { messages } = useAppState();
  const unread = messages.filter((m) => !m.read).length;
  const starred = messages.filter((m) => m.starred).length;
  const latest = messages[0];

  const focus = useCallback(
    (id: string): WorldFocusSpec | null => {
      if (id === "office" || id === "unread") {
        return {
          title: "Post office",
          tone: "coral",
          icon: <Mail size={18} strokeWidth={1.8} />,
          rows: [
            ["Messages", String(messages.length)],
            ["Unread", String(unread)],
            ["Starred", String(starred)],
          ],
        };
      }
      const m = messages.find((x) => `msg-${x.id}` === id);
      if (!m) return null;
      return {
        title: m.from,
        tone: m.read ? "blue" : "coral",
        icon: <FileText size={18} strokeWidth={1.8} />,
        rows: [
          ["Subject", <span key="s" className="block max-w-[150px] truncate">{m.subject}</span>],
          ["Sent", dateTime(m.at).replace(/, \d{4}/, "")],
          ["Status", m.read ? "Read" : "Unread"],
        ],
        footer: <p className="text-[12px] text-muted">Opened in the reader below ↓</p>,
      };
    },
    [messages, starred, unread],
  );

  return (
    <WorldPanel
      scene="inbox"
      eyebrow="Mail room"
      at={0.06}
      focus={focus}
      onSelect={(id) => {
        if (id?.startsWith("msg-")) onOpen(id.slice(4));
      }}
      cards={[
        { id: "unread", anchor: "unread", side: "left", tone: "coral", label: "Unread", value: `${unread} new` },
        { id: "starred", anchor: "starred", side: "left", tone: "amber", label: "Starred", value: String(starred) },
        { id: "latest", anchor: latest ? `msg-${latest.id}` : "office", side: "right", tone: "blue", label: "Latest from", value: <span className="block max-w-[150px] truncate text-[16px]">{latest?.from ?? "—"}</span> },
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Program — rewards park                                             */
/* ------------------------------------------------------------------ */

export function ProgramWorldPanel({
  perks,
  onRedeem,
}: {
  perks: { id: string; title: string; cost: number }[];
  onRedeem: (perkId: string) => void;
}) {
  const { rewards } = useAppState();
  const tier = rewards.points >= 25000 ? "Platinum" : rewards.points >= 10000 ? "Gold" : "Silver";
  const nextAt = rewards.points >= 25000 ? null : rewards.points >= 10000 ? 25000 : 10000;

  const focus = useCallback(
    (id: string): WorldFocusSpec | null => {
      if (id === "podium" || id === "crown") {
        return {
          title: `${tier} tier`,
          tone: "amber",
          icon: <Crown size={18} strokeWidth={1.8} />,
          rows: [
            ["Points", int(rewards.points)],
            ["Next tier", nextAt ? `${int(nextAt - rewards.points)} to go` : "Top tier"],
            ["Programs on", String(rewards.enrolled.length)],
          ],
        };
      }
      const perk = perks.find((p) => `perk-${p.id}` === id);
      if (!perk) return null;
      const done = rewards.redeemed.includes(perk.id);
      return {
        title: perk.title,
        tone: done ? "green" : "purple",
        icon: <Gift size={18} strokeWidth={1.8} />,
        rows: [
          ["Cost", `${int(perk.cost)} pts`],
          ["Status", done ? "Redeemed" : rewards.points >= perk.cost ? "Available" : "Locked"],
        ],
        footer: done ? undefined : (
          <Button size="sm" className="w-full" disabled={rewards.points < perk.cost} onClick={() => onRedeem(perk.id)}>
            Redeem
          </Button>
        ),
      };
    },
    [nextAt, onRedeem, perks, rewards, tier],
  );

  return (
    <WorldPanel
      scene="program"
      eyebrow="Rewards park"
      at={0.06}
      focus={focus}
      tags={perks.map((p) => ({
        id: `t-${p.id}`,
        anchor: `perk-${p.id}`,
        content: <WorldChip tone={rewards.redeemed.includes(p.id) ? "#1FB07B" : "#8B5CF6"}>{p.title.split(" ").slice(0, 2).join(" ")}</WorldChip>,
      }))}
      cards={[
        { id: "pts", anchor: "podium", side: "left", tone: "amber", label: "Points", value: <AnimatedNumber value={rewards.points} format={(v) => int(v)} at={0.3} /> },
        { id: "tier", anchor: "crown", side: "left", tone: "purple", label: "Tier", value: tier },
        { id: "next", anchor: "crown", side: "right", tone: "blue", label: "Next tier", value: nextAt ? `${int(nextAt - rewards.points)} pts` : "Maxed" },
        { id: "redeemed", anchor: "podium", side: "right", tone: "green", label: "Perks redeemed", value: String(rewards.redeemed.length) },
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Account — HQ                                                       */
/* ------------------------------------------------------------------ */

export function AccountWorldPanel() {
  const { profile } = useAppState();
  const dispatch = useDispatch();
  const theme = useTheme();

  const toggleRow = (label: string, on: boolean, flip: () => void) => (
    <div className="flex items-center justify-between rounded-[12px] bg-well px-3 py-2">
      <span className="text-[13px] text-ink-2">{label}</span>
      <Toggle checked={on} onChange={flip} label={label} />
    </div>
  );

  const focus = useCallback(
    (id: string): WorldFocusSpec | null => {
      switch (id) {
        case "hq":
        case "security":
          return {
            title: "Security",
            tone: profile.twoFactor ? "green" : "coral",
            icon: <ShieldCheck size={18} strokeWidth={1.8} />,
            rows: [
              ["2-factor", profile.twoFactor ? "On" : "Off"],
              ["Last sign-in", "Chrome · Windows"],
            ],
            footer: toggleRow("Two-factor sign-in", profile.twoFactor, () => dispatch({ type: "updateProfile", patch: { twoFactor: !profile.twoFactor } })),
          };
        case "push":
          return {
            title: "Push alerts",
            tone: "blue",
            icon: <Bell size={18} strokeWidth={1.8} />,
            rows: [["Status", profile.pushAlerts ? "Streaming" : "Paused"]],
            footer: toggleRow("Push notifications", profile.pushAlerts, () => dispatch({ type: "updateProfile", patch: { pushAlerts: !profile.pushAlerts } })),
          };
        case "email":
          return {
            title: "Email alerts",
            tone: "purple",
            icon: <Mail size={18} strokeWidth={1.8} />,
            rows: [["Sending to", profile.email]],
            footer: toggleRow("Email alerts", profile.emailAlerts, () => dispatch({ type: "updateProfile", patch: { emailAlerts: !profile.emailAlerts } })),
          };
        case "digest":
          return {
            title: "Weekly digest",
            tone: "amber",
            icon: <CalendarClock size={18} strokeWidth={1.8} />,
            rows: [["Next issue", "Monday 9:00"]],
            footer: toggleRow("Weekly digest", profile.weeklyDigest, () => dispatch({ type: "updateProfile", patch: { weeklyDigest: !profile.weeklyDigest } })),
          };
        case "theme":
          return {
            title: theme === "dark" ? "Night mode" : "Day mode",
            tone: "ink",
            icon: theme === "dark" ? <Moon size={18} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />,
            rows: [["Theme", theme === "dark" ? "Dark" : "Light"]],
            footer: toggleRow("Dark theme", theme === "dark", () => setTheme(theme === "dark" ? "light" : "dark")),
          };
        default:
          return null;
      }
    },
    [dispatch, profile, theme],
  );

  const alerts = [profile.emailAlerts && "Email", profile.pushAlerts && "Push"].filter(Boolean).join(" + ") || "Off";

  return (
    <WorldPanel
      scene="account"
      eyebrow="Your HQ"
      at={0.06}
      focus={focus}
      cards={[
        { id: "sec", anchor: "security", side: "left", tone: profile.twoFactor ? "green" : "coral", label: "Security", value: profile.twoFactor ? "Shield up" : "Shield down" },
        { id: "alerts", anchor: "push", side: "right", tone: "blue", label: "Alerts", value: alerts },
        { id: "theme", anchor: "theme", side: "left", tone: "amber", label: "Theme", value: theme === "dark" ? "Night" : "Day" },
        { id: "digest", anchor: "digest", side: "right", tone: "purple", label: "Weekly digest", value: profile.weeklyDigest ? "On" : "Off" },
      ]}
    />
  );
}
