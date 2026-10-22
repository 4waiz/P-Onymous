"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  Camera,
  Car,
  Gift,
  Heart,
  House,
  Laptop,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { GoalRing } from "@/components/charts/GoalRing";
import { HatchedProgress } from "@/components/charts/primitives";
import { SavingsBars } from "@/components/charts/SavingsBars";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { EASE_OUT, useTiming } from "@/components/motion/timing";
import { Delta } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectInput, TextInput } from "@/components/ui/fields";
import { Modal, useToast } from "@/components/ui/overlay";
import { Toggle } from "@/components/ui/Toggle";
import { cx } from "@/lib/cx";
import { money, monthYear, nowStamp, pct } from "@/lib/format";
import { useAppState, useDispatch } from "@/lib/store";
import type { AppState, Goal, GoalIcon, GoalTone } from "@/lib/types";
import { CardTitle, PageHeader } from "../PageHeader";

export const GOAL_ICONS: Record<GoalIcon, LucideIcon> = {
  laptop: Laptop,
  plane: Send,
  shield: ShieldCheck,
  car: Car,
  gift: Gift,
  home: House,
  heart: Heart,
  camera: Camera,
};

const TONES: Record<GoalTone, { bg: string; fg: string }> = {
  coral: { bg: "#FDE7E0", fg: "#E2532E" },
  blue: { bg: "#E2EEFD", fg: "#3C78E0" },
  green: { bg: "#DFF5E7", fg: "#24A266" },
  purple: { bg: "#ECE5FD", fg: "#7A4FE0" },
  pink: { bg: "#FCE3EF", fg: "#D8457F" },
  amber: { bg: "#FDF1D6", fg: "#C98B0B" },
};

export function SavingsPage() {
  const [newOpen, setNewOpen] = useState(false);
  const [addFor, setAddFor] = useState<string | null>(null);
  return (
    <div>
      <PageHeader
        title="Savings & Goals"
        subtitle="Set money aside for the things that matter — and watch it grow."
        subtitleAt={0.45}
        actionsAt={0.5}
        actions={
          <Button size="lg" className="h-[47px] px-[24px] text-[14.5px]" icon={<Plus size={16} strokeWidth={2} />} onClick={() => setNewOpen(true)}>
            New goal
          </Button>
        }
      />
      <div className="mb-[24px] grid grid-cols-1 gap-[24px] lg:grid-cols-[3fr_2fr]">
        <TotalSavedPanel />
        <AutoSavePanel />
      </div>
      <GoalGrid onAddMoney={setAddFor} onNew={() => setNewOpen(true)} />
      <NewGoalDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <AddMoneyDialog goalId={addFor} onClose={() => setAddFor(null)} />
    </div>
  );
}

function totals(state: AppState) {
  const saved = state.goals.reduce((s, g) => s + g.saved, 0);
  const target = state.goals.reduce((s, g) => s + g.target, 0);
  return { saved, target, percent: pct(saved, target) };
}

function TotalSavedPanel() {
  const state = useAppState();
  const { saved, target, percent } = totals(state);
  const format = useCallback((v: number) => money(v), []);
  return (
    <Panel at={0.05} contentAt={0.2} className="flex flex-col gap-6 pb-[22px] pl-[21px] pr-[14px] pt-[24px] md:h-[278px] md:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <Reveal>
          <p className="text-[14.5px] tracking-[-0.01em] text-ink-2">Total saved</p>
        </Reveal>
        <Reveal at={0.02} className="mt-[14px]">
          <AnimatedNumber value={saved} format={format} at={0.0} duration={1.5} className="block text-[38px] font-[650] leading-[44px] tracking-[-0.03em] text-ink" />
        </Reveal>
        <Reveal at={0.08} className="mt-[13px] flex items-center gap-[9px]">
          <Delta value={12} />
          <span className="text-[12px] text-muted">more than last quarter</span>
        </Reveal>
        <div className="mt-auto pt-6">
          <HatchedProgress value={percent} at={0.3} height={11} label="Saved toward all goals" className="max-w-[312px]" />
          <Reveal at={0.32} className="mt-[12px] text-[11.5px] text-muted">
            {percent}% of {money(target, 0)} across {state.goals.length} goals
          </Reveal>
        </div>
      </div>
      <div className="flex w-full flex-col md:w-[321px] md:shrink-0">
        <Reveal at={0.02} className="pl-[6px]">
          <p className="text-[11.5px] text-muted">Monthly contributions</p>
        </Reveal>
        <div className="mt-[18px] flex-1">
          <SavingsBars data={state.contributions} at={0.22} height={182} />
        </div>
      </div>
    </Panel>
  );
}

const AUTOSAVE: { key: keyof AppState["autoSave"]; title: string; body: string; icon: LucideIcon }[] = [
  { key: "roundUps", title: "Round-ups", body: "Round every card payment up to the next dollar.", icon: RefreshCw },
  { key: "paydayBoost", title: "Payday boost", body: "Move 10% of every salary into goals automatically.", icon: Zap },
  { key: "weekly50", title: "Weekly $50", body: "A small transfer every Monday morning.", icon: CalendarClock },
];

function AutoSavePanel() {
  const { autoSave } = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const on = Object.values(autoSave).filter(Boolean).length;
  return (
    <Panel at={0.1} contentAt={0.3} className="px-[21px] pb-[14px] pt-[22px] md:h-[278px]">
      <Reveal className="flex items-center justify-between">
        <CardTitle>Auto-save</CardTitle>
        <motion.span
          key={on}
          initial={{ scale: 0.85, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 24 }}
          className={cx("inline-flex h-[21px] items-center rounded-[7px] px-[8px] text-[10.5px] font-medium", on ? "bg-pos-bg text-pos" : "bg-inset text-muted")}
          aria-live="polite"
        >
          {on} on
        </motion.span>
      </Reveal>
      <ul className="mt-[16px]">
        {AUTOSAVE.map((row, i) => {
          const Icon = row.icon;
          const checked = autoSave[row.key];
          return (
            <li key={row.key} className={cx(i > 0 && "border-t border-line")}>
              <Reveal at={0.06 + i * 0.1} y={8} className="flex items-center gap-[14px] py-[13px]">
                <span className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] bg-inset text-ink-2">
                  <Icon size={15} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-ink">{row.title}</p>
                  <p className="mt-[3px] truncate text-[11.5px] text-muted">{row.body}</p>
                </div>
                <Toggle
                  checked={checked}
                  label={row.title}
                  onChange={() => {
                    dispatch({ type: "toggleAutoSave", key: row.key });
                    toast({ title: `${row.title} ${checked ? "paused" : "turned on"}`, tone: checked ? "info" : "success" });
                  }}
                />
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function GoalGrid({ onAddMoney, onNew }: { onAddMoney: (id: string) => void; onNew: () => void }) {
  const { goals } = useAppState();
  const { delay, dur, still } = useTiming();
  return (
    <ul className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {goals.map((g, i) => (
        <GoalCard key={g.id} goal={g} index={i} onAddMoney={() => onAddMoney(g.id)} />
      ))}
      {goals.length < 10 && (
        <motion.li
          initial={still ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay(0.25 + goals.length * 0.05), duration: dur(0.4), ease: EASE_OUT }}
          className={cx(goals.length % 5 === 0 ? "hidden" : "hidden xl:block")}
        >
          <button
            type="button"
            onClick={onNew}
            className="flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-3 rounded-[22px] border-[1.5px] border-dashed border-line-strong text-[13px] text-muted transition-colors hover:border-muted-2 hover:text-ink"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-card">
              <Plus size={18} strokeWidth={1.8} />
            </span>
            New goal
          </button>
        </motion.li>
      )}
    </ul>
  );
}

function GoalCard({ goal: g, index, onAddMoney }: { goal: Goal; index: number; onAddMoney: () => void }) {
  const { delay, dur, still } = useTiming();
  const Icon = GOAL_ICONS[g.icon];
  const tone = TONES[g.tone];
  const percent = (g.saved / g.target) * 100;
  const base = 0.15 + index * 0.04;
  return (
    <motion.li
      initial={still ? false : { opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay(base), duration: dur(0.4), ease: EASE_OUT }}
      whileHover={{ y: -3 }}
      className="flex flex-col rounded-[22px] bg-card px-[17px] pb-[16px] pt-[25px] shadow-card"
    >
      <Reveal at={base + 0.12} className="flex items-center justify-between">
        <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[11px]" style={{ background: tone.bg, color: tone.fg }}>
          <Icon size={15} strokeWidth={1.9} />
        </span>
        <span className="inline-flex h-[24px] items-center rounded-full bg-inset px-[10px] text-[10.5px] font-medium text-ink-2">{monthYear(g.due)}</span>
      </Reveal>
      <div className="mt-[15px] flex justify-center">
        <GoalRing percent={percent} at={0.3 + index * 0.08} />
      </div>
      <Reveal at={base + 0.25} className="mt-[16px] text-center">
        <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-ink">{g.name}</p>
        <p className="mt-[5px] text-[11.5px] text-muted-2">
          <span className="num font-semibold text-ink">{money(g.saved, 0)}</span> of {money(g.target, 0)}
        </p>
      </Reveal>
      <Reveal at={base + 0.3} className="mt-[18px]">
        <Button variant="soft" size="sm" className="h-[34px] w-full text-[12.5px] font-normal" icon={<Plus size={13} strokeWidth={2} />} onClick={onAddMoney} aria-label={`Add money to ${g.name}`}>
          Add money
        </Button>
      </Reveal>
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */
/*  Flows                                                              */
/* ------------------------------------------------------------------ */

function NewGoalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New goal" description="Give it a name, a target and a date." width={460}>
      {open && <NewGoalForm onClose={onClose} />}
    </Modal>
  );
}

function NewGoalForm({ onClose }: { onClose: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [initial, setInitial] = useState("");
  const [due, setDue] = useState("2027-06");
  const [icon, setIcon] = useState<GoalIcon>("home");
  const [submitted, setSubmitted] = useState(false);
  const t = Number(target);
  const init = initial ? Number(initial) : 0;
  const errors = {
    name: name.trim().length < 2 ? "Name your goal." : null,
    target: !target ? "Set a target amount." : !(t > 0) ? "Target must be more than $0." : t > 1_000_000 ? "Keep demo targets under $1,000,000." : null,
    initial: init < 0 ? "Can’t be negative." : init > t && t > 0 ? "Starting amount can’t exceed the target." : init > state.balanceUSD ? "More than your available balance." : null,
    due: /^\d{4}-\d{2}$/.test(due) ? null : "Pick a month.",
  };
  const invalid = Object.values(errors).some(Boolean);

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (invalid) return;
        dispatch({ type: "addGoal", name, target: t, due, icon, initial: init, at: nowStamp() });
        toast({ title: `Goal “${name.trim()}” created`, description: init ? `Started with ${money(init)}` : "Add money whenever you like" });
        onClose();
      }}
    >
      <TextInput label="Goal name" data-autofocus value={name} onChange={(e) => setName(e.target.value)} error={submitted ? errors.name : null} placeholder="e.g. New apartment" maxLength={32} />
      <div className="grid grid-cols-2 gap-3">
        <TextInput label="Target" prefix="$" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))} error={submitted ? errors.target : null} placeholder="5,000" />
        <TextInput label="Start with (optional)" prefix="$" inputMode="decimal" value={initial} onChange={(e) => setInitial(e.target.value.replace(/[^\d.]/g, ""))} error={submitted ? errors.initial : null} placeholder="0" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextInput label="Target month" type="month" value={due} onChange={(e) => setDue(e.target.value)} error={submitted ? errors.due : null} />
        <SelectInput label="Icon" value={icon} onChange={(e) => setIcon(e.target.value as GoalIcon)}>
          {(Object.keys(GOAL_ICONS) as GoalIcon[]).map((k) => (
            <option key={k} value={k}>
              {k[0].toUpperCase() + k.slice(1)}
            </option>
          ))}
        </SelectInput>
      </div>
      <div className="mt-1 flex justify-end gap-2">
        <Button variant="soft" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" icon={<Plus size={15} strokeWidth={2} />}>
          Create goal
        </Button>
      </div>
    </form>
  );
}

function AddMoneyDialog({ goalId, onClose }: { goalId: string | null; onClose: () => void }) {
  const { goals } = useAppState();
  const goal = goals.find((g) => g.id === goalId);
  return (
    <Modal open={!!goal} onClose={onClose} title={goal ? `Add money · ${goal.name}` : "Add money"} description="Moves demo funds from your USD wallet." width={420}>
      {goal && <AddMoneyForm key={goal.id} goal={goal} onClose={onClose} />}
    </Modal>
  );
}

function AddMoneyForm({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const remaining = Math.max(0, goal.target - goal.saved);
  const [raw, setRaw] = useState(String(Math.min(100, remaining || 100)));
  const [submitted, setSubmitted] = useState(false);
  const v = Number(raw);
  const error = !raw ? "Enter an amount." : !(v > 0) ? "Amount must be greater than $0." : v > state.balanceUSD ? "More than your available balance." : v > 100000 ? "Keep demo top-ups under $100,000." : null;
  const after = Math.min(100, ((goal.saved + (error ? 0 : v)) / goal.target) * 100);

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (error) return;
        dispatch({ type: "addMoney", goalId: goal.id, amount: v, at: nowStamp() });
        toast({ title: `Added ${money(v)} to ${goal.name}`, description: `${Math.round(after)}% saved` });
        onClose();
      }}
    >
      <div className="flex items-center gap-4 rounded-[18px] bg-inset p-4">
        <GoalRing percent={after} size={74} stroke={7} />
        <div className="text-[13px]">
          <p className="text-muted">After this top-up</p>
          <p className="num mt-0.5 text-[18px] font-semibold">
            {money(goal.saved + (error ? 0 : v), 0)} <span className="text-[13px] font-normal text-muted">of {money(goal.target, 0)}</span>
          </p>
          <p className="mt-0.5 text-muted">{remaining > 0 ? `${money(remaining, 0)} to go` : "Goal reached 🎉"}</p>
        </div>
      </div>
      <TextInput label="Amount" prefix="$" inputMode="decimal" data-autofocus value={raw} onChange={(e) => setRaw(e.target.value.replace(/[^\d.]/g, ""))} error={submitted ? error : null} hint={`Available ${money(state.balanceUSD)}`} />
      <div className="flex flex-wrap gap-2">
        {[25, 50, 100, 250].map((p) => (
          <button key={p} type="button" onClick={() => setRaw(String(p))} className={cx("h-[30px] rounded-full px-3 text-[12px] font-medium transition-colors", Number(raw) === p ? "bg-pill text-pill-fg" : "bg-inset hover:bg-inset-strong")}>
            ${p}
          </button>
        ))}
        {remaining > 0 && (
          <button type="button" onClick={() => setRaw(String(remaining))} className="h-[30px] rounded-full bg-inset px-3 text-[12px] font-medium hover:bg-inset-strong">
            Finish goal · {money(remaining, 0)}
          </button>
        )}
      </div>
      <div className="mt-1 flex justify-end gap-2">
        <Button variant="soft" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" icon={<Plus size={15} strokeWidth={2} />}>
          Add money
        </Button>
      </div>
    </form>
  );
}
