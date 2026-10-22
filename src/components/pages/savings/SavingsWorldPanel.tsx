"use client";

import { Construction, Landmark, Plus, Truck } from "lucide-react";
import { useCallback, useMemo } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Button } from "@/components/ui/Button";
import { WorldChip } from "@/components/world/Tag";
import { WorldPanel, type WorldFocusSpec } from "@/components/world/WorldPanel";
import { money, monthYear, pct } from "@/lib/format";
import { useAppState } from "@/lib/store";

const fmt = (v: number) => money(v, 0);
const TONE_HEX = { coral: "#F2895A", blue: "#4C66EA", green: "#3CC69A", purple: "#9B6BF2", pink: "#EE7BAA", amber: "#F2C230" } as const;

/** Goals as towers under construction; "Add money" raises them. */
export function SavingsWorldPanel({ onAddMoney }: { onAddMoney: (goalId: string) => void }) {
  const { goals, contributions, autoSave } = useAppState();
  const saved = goals.reduce((s, g) => s + g.saved, 0);
  const thisMonth = contributions.at(-1)?.amount ?? 0;
  const on = Object.values(autoSave).filter(Boolean).length;
  const closest = useMemo(() => [...goals].filter((g) => g.saved < g.target).sort((a, b) => b.saved / b.target - a.saved / a.target)[0], [goals]);

  const focus = useCallback(
    (id: string): WorldFocusSpec | null => {
      if (id === "vault") {
        return {
          title: "Savings vault",
          tone: "green",
          icon: <Landmark size={18} strokeWidth={1.8} />,
          rows: [
            ["Total saved", money(saved, 0)],
            ["This month", `+${money(thisMonth, 0)}`],
            ["Goals", String(goals.length)],
          ],
        };
      }
      if (id === "truck") {
        return {
          title: "Auto-save",
          tone: "purple",
          icon: <Truck size={18} strokeWidth={1.8} />,
          rows: [
            ["Round-ups", autoSave.roundUps ? "On" : "Off"],
            ["Payday boost", autoSave.paydayBoost ? "On" : "Off"],
            ["Weekly $50", autoSave.weekly50 ? "On" : "Off"],
          ],
        };
      }
      const g = goals.find((x) => `g-${x.id}` === id);
      if (!g) return null;
      return {
        title: g.name,
        tone: "coral",
        icon: <Construction size={18} strokeWidth={1.8} />,
        rows: [
          ["Built", `${pct(g.saved, g.target)}%`],
          ["Saved", `${money(g.saved, 0)} of ${money(g.target, 0)}`],
          ["Due", monthYear(g.due)],
        ],
        footer: (
          <Button size="sm" className="w-full" icon={<Plus size={14} strokeWidth={2} />} onClick={() => onAddMoney(g.id)}>
            Add money
          </Button>
        ),
      };
    },
    [autoSave, goals, onAddMoney, saved, thisMonth],
  );

  return (
    <WorldPanel
      scene="savings"
      eyebrow="Goals under construction"
      at={0.08}
      height={480}
      focus={focus}
      tags={goals.map((g) => ({
        id: `tag-${g.id}`,
        anchor: `g-${g.id}`,
        content: (
          <WorldChip tone={TONE_HEX[g.tone]}>
            <span className="max-w-[110px] truncate">{g.name}</span>
            <span className="text-muted">{pct(g.saved, g.target)}%</span>
          </WorldChip>
        ),
      }))}
      cards={[
        { id: "total", anchor: "vault", side: "left", tone: "green", label: "Total saved", value: <AnimatedNumber value={saved} format={fmt} at={0.3} /> },
        { id: "month", anchor: "vault", side: "left", tone: "amber", label: "This month", value: `+${money(thisMonth, 0)}` },
        { id: "auto", anchor: "truck", side: "right", tone: "purple", label: "Auto-save", value: `${on} rules on` },
        {
          id: "closest",
          anchor: closest ? `g-${closest.id}` : "vault",
          side: "right",
          tone: "pink",
          label: "Closest goal",
          value: <span className="block max-w-[150px] truncate text-[16px]">{closest ? `${closest.name} · ${pct(closest.saved, closest.target)}%` : "All done 🎉"}</span>,
        },
      ]}
    />
  );
}
