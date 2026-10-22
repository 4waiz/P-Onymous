"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Eye, EyeOff, Globe, Landmark, Nfc, Plus, RotateCw, Send, Snowflake, Sun } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { HatchedProgress } from "@/components/charts/primitives";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { EASE_OUT, useTiming } from "@/components/motion/timing";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/fields";
import { Modal, useToast } from "@/components/ui/overlay";
import { Toggle } from "@/components/ui/Toggle";
import { cx } from "@/lib/cx";
import { money, pct } from "@/lib/format";
import { useAppState, useDispatch } from "@/lib/store";
import type { CardColor, CardControls, PaymentCard } from "@/lib/types";
import { CardTitle, PageHeader } from "../PageHeader";
import { BankCard } from "./BankCard";

const MIN_LIMIT = 1000;
const MAX_LIMIT = 20000;

export function ManagePage() {
  const [newOpen, setNewOpen] = useState(false);
  return (
    <div>
      <PageHeader
        title="Manage"
        subtitle="Freeze cards, fine-tune limits and decide which wallets stay switched on."
        subtitleAt={0.3}
        actionsAt={0.32}
        actions={
          <Button size="lg" className="h-[47px] px-[24px] text-[14.5px]" icon={<Plus size={16} strokeWidth={2} />} onClick={() => setNewOpen(true)}>
            New card
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-[1.1fr_1fr]">
        <YourCards onNew={() => setNewOpen(true)} />
        <CardControlsPanel />
      </div>
      <NewCardDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}

function useSelectedCard() {
  const state = useAppState();
  return state.cards.find((c) => c.id === state.selectedCardId) ?? state.cards[0];
}

/* ------------------------------------------------------------------ */
/*  Your cards                                                         */
/* ------------------------------------------------------------------ */

function YourCards({ onNew }: { onNew: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const card = useSelectedCard();
  const [flipped, setFlipped] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { delay, dur, still } = useTiming();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(card.number.replace(/\s/g, ""));
      setCopied(true);
      toast({ title: "Card number copied", description: `Demo card •• ${card.last4}` });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: "Clipboard unavailable", description: "Your browser blocked clipboard access.", tone: "error" });
    }
  };

  return (
    <Panel at={0.1} contentAt={0.18} className="flex flex-col px-[20px] pb-[21px] pt-[25px]">
      <Reveal className="flex items-center justify-between">
        <CardTitle>Your cards</CardTitle>
        <span className="text-[11.5px] text-muted-2">
          {state.cards.length} {state.cards.length === 1 ? "card" : "cards"}
        </span>
      </Reveal>

      <Reveal at={0.0} y={8} blur={2} className="mt-[21px] flex flex-col items-center rounded-[20px] bg-inset px-4 pb-[10px] pt-[25px]">
        <motion.div
          className="w-full max-w-[411px]"
          initial={still ? false : { opacity: 0.35, filter: "blur(12px) grayscale(0.6)", scale: 0.97 }}
          animate={{ opacity: 1, filter: "blur(0px) grayscale(0)", scale: 1, transitionEnd: { filter: "none" } }}
          transition={{ delay: delay(0.07), duration: dur(0.45), ease: EASE_OUT }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: 30, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: -30, rotate: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <BankCard card={card} flipped={flipped} reveal={reveal} onFlip={() => setFlipped((f) => !f)} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <p className="mt-[16px] text-[10.5px] text-muted-2">Tap the card to flip it ↻</p>
      </Reveal>

      <Reveal at={0.22} className="mt-[13px] flex flex-wrap items-center gap-[10px]" role="radiogroup" aria-label="Choose card">
        {state.cards.map((c) => {
          const active = c.id === card.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${c.label} card ending ${c.last4}`}
              onClick={() => {
                dispatch({ type: "selectCard", id: c.id });
                setFlipped(false);
                setReveal(false);
              }}
              className={cx(
                "relative flex h-[36px] items-center gap-[8px] rounded-full pl-[8px] pr-[13px] text-[11.5px] text-ink-2 transition-colors",
                active ? "bg-card" : "hover:bg-inset",
              )}
            >
              {active && (
                <motion.span layoutId="card-selector" className="absolute inset-0 rounded-full ring-[1.5px] ring-inset ring-ink" transition={{ type: "spring", stiffness: 460, damping: 36 }} />
              )}
              <span
                className="relative h-[17px] w-[25px] rounded-[4px]"
                style={{ background: c.color === "black" ? "#1C191F" : c.color === "coral" ? "#EC5A33" : "#8574EA" }}
              />
              <span className="relative num">•• {c.last4}</span>
              {c.frozen && <Snowflake size={11} className="relative text-[#2F6FB5]" />}
            </button>
          );
        })}
        <button type="button" onClick={onNew} aria-label="Add a new card" className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-card text-ink-2 shadow-card transition-colors hover:text-ink">
          <Plus size={14} strokeWidth={1.9} />
        </button>
      </Reveal>

      <div className="mt-[16px] grid grid-cols-2 gap-[10px] sm:grid-cols-4">
        <ActionTile
          at={0.27}
          label={card.frozen ? "Unfreeze" : "Freeze"}
          active={card.frozen}
          icon={card.frozen ? <Sun size={15} strokeWidth={1.8} /> : <Snowflake size={15} strokeWidth={1.8} />}
          onClick={() => {
            dispatch({ type: "toggleFreeze", id: card.id });
            toast({
              title: card.frozen ? `Card •• ${card.last4} unfrozen` : `Card •• ${card.last4} frozen`,
              description: card.frozen ? "Payments are allowed again." : "All new payments will be declined.",
              tone: card.frozen ? "success" : "info",
            });
          }}
        />
        <ActionTile
          at={0.31}
          label={reveal ? "Hide number" : "Show number"}
          active={reveal}
          icon={reveal ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
          onClick={() => {
            setReveal((r) => !r);
            setFlipped(false);
          }}
        />
        <ActionTile at={0.35} label={copied ? "Copied" : "Copy number"} active={copied} icon={copied ? <Check size={15} strokeWidth={2} /> : <Copy size={15} strokeWidth={1.8} />} onClick={copy} />
        <ActionTile at={0.39} label="Flip card" icon={<RotateCw size={15} strokeWidth={1.8} />} onClick={() => setFlipped((f) => !f)} />
      </div>
    </Panel>
  );
}

function ActionTile({ label, icon, onClick, at, active }: { label: string; icon: ReactNode; onClick: () => void; at: number; active?: boolean }) {
  return (
    <Reveal at={at} y={8}>
      <motion.button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={cx("flex h-[92px] w-full flex-col items-center justify-center gap-[10px] rounded-[16px] text-[11.5px] text-ink-2 transition-colors", active ? "bg-inset-strong text-ink" : "bg-inset hover:bg-inset-strong")}
      >
        <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-card text-ink shadow-card">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={label} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
              {icon}
            </motion.span>
          </AnimatePresence>
        </span>
        {label}
      </motion.button>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Card controls                                                      */
/* ------------------------------------------------------------------ */

const CONTROLS: { key: keyof CardControls; title: string; body: string; icon: ReactNode }[] = [
  { key: "online", title: "Online payments", body: "Shops, subscriptions and in-app purchases", icon: <Globe size={15} strokeWidth={1.8} /> },
  { key: "contactless", title: "Contactless", body: "Tap to pay up to $250 per payment", icon: <Nfc size={15} strokeWidth={1.8} /> },
  { key: "atm", title: "ATM withdrawals", body: "Up to $1,000 per day", icon: <Landmark size={15} strokeWidth={1.8} /> },
  { key: "abroad", title: "Use abroad", body: "Payments outside Bangladesh", icon: <Send size={15} strokeWidth={1.8} /> },
];

function CardControlsPanel() {
  const card = useSelectedCard();
  const dispatch = useDispatch();
  return (
    <Panel at={0.13} contentAt={0.3} className="flex flex-col px-[23px] pb-[21px] pt-[25px]">
      <Reveal className="flex items-center justify-between">
        <CardTitle>Card controls</CardTitle>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={String(card.frozen)}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className={cx("inline-flex h-[21px] items-center rounded-[7px] px-[8px] text-[10.5px] font-medium", card.frozen ? "bg-info-bg text-info" : "bg-pos-bg text-pos")}
          >
            {card.frozen ? "Frozen" : "Active"}
          </motion.span>
        </AnimatePresence>
      </Reveal>

      <ul className="mt-[16px]">
        {CONTROLS.map((row, i) => (
          <li key={row.key} className={cx(i > 0 && "border-t border-line")}>
            <Reveal at={0.05 + i * 0.08} y={8} className={cx("flex items-center gap-[14px] py-[12.5px] transition-opacity", card.frozen && "opacity-55")}>
              <span className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] bg-inset text-ink-2">{row.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-ink">{row.title}</p>
                <p className="mt-[3px] truncate text-[11.5px] text-muted">{row.body}</p>
              </div>
              <Toggle
                checked={card.controls[row.key] && !card.frozen}
                disabled={card.frozen}
                label={`${row.title} for card ending ${card.last4}`}
                onChange={(v) => dispatch({ type: "setControl", id: card.id, key: row.key, value: v })}
              />
            </Reveal>
          </li>
        ))}
      </ul>
      {card.frozen && (
        <p className="mt-1 text-[11.5px] text-info" role="status">
          This card is frozen — controls are locked until you unfreeze it.
        </p>
      )}

      <SpendingLimit card={card} />
    </Panel>
  );
}

function SpendingLimit({ card }: { card: PaymentCard }) {
  const dispatch = useDispatch();
  const { delay, dur, still } = useTiming();
  const [entered, setEntered] = useState(false);
  const fraction = (card.limit - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT);
  const usedPct = pct(card.spent, card.limit);
  const format = useCallback((v: number) => money(v), []);
  const transition = { delay: entered ? 0 : delay(0.36), duration: entered ? 0.12 : dur(0.5), ease: EASE_OUT };

  return (
    <Reveal at={0.33} y={10} className="mt-[20px] rounded-[18px] bg-inset px-[18px] pb-[20px] pt-[15px]">
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] text-ink-2">Monthly spending limit</p>
        <span className="num text-[26px] font-[650] tracking-[-0.025em] text-ink">{format(card.limit)}</span>
      </div>

      <div className="relative mt-[4px] h-[22px]">
        <div className="absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-inset-strong" />
        <motion.div
          className="absolute left-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-accent"
          initial={still ? false : { width: "0%" }}
          animate={{ width: `${fraction * 100}%` }}
          transition={transition}
        />
        <input
          type="range"
          min={MIN_LIMIT}
          max={MAX_LIMIT}
          step={100}
          value={card.limit}
          disabled={card.frozen}
          aria-label="Monthly spending limit"
          aria-valuetext={money(card.limit)}
          onChange={(e) => dispatch({ type: "setLimit", id: card.id, limit: Number(e.target.value) })}
          className="range-overlay absolute inset-0 z-10 h-full w-full disabled:cursor-not-allowed"
        />
        <motion.span
          aria-hidden
          className="range-thumb-ring pointer-events-none absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_3.5px_var(--accent),0_3px_8px_rgba(234,85,47,0.35)]"
          initial={still ? false : { left: "0%" }}
          animate={{ left: `${fraction * 100}%` }}
          transition={transition}
          onAnimationComplete={() => setEntered(true)}
        />
      </div>
      <div className="mt-[6px] flex justify-between text-[10px] text-muted-2">
        <span>{money(MIN_LIMIT, 0)}</span>
        <span>{money(MAX_LIMIT, 0)}</span>
      </div>

      <HatchedProgress value={usedPct} at={0.5} height={10} label="Used of monthly limit" className="mt-[14px]" />
      <p className="mt-[10px] text-[11px] text-muted">
        <span className="num font-semibold text-ink">{money(card.spent)}</span> used · {usedPct}%
      </p>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  New card                                                           */
/* ------------------------------------------------------------------ */

function NewCardDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New virtual card" description="Issued instantly — demo only, no real card is created." width={440}>
      {open && <NewCardForm onClose={onClose} />}
    </Modal>
  );
}

function NewCardForm({ onClose }: { onClose: () => void }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [label, setLabel] = useState("Subscriptions");
  const [color, setColor] = useState<CardColor>("lilac");
  const [submitted, setSubmitted] = useState(false);
  const error = label.trim().length < 2 ? "Give the card a name." : null;
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (error) return;
        dispatch({ type: "addCard", color, label });
        toast({ title: `“${label.trim()}” card issued`, description: "Selected and ready in Your cards" });
        onClose();
      }}
    >
      <TextInput label="Card name" data-autofocus value={label} onChange={(e) => setLabel(e.target.value)} error={submitted ? error : null} maxLength={24} />
      <fieldset>
        <legend className="mb-2 text-[12.5px] font-medium text-ink-2">Colour</legend>
        <div className="flex gap-3">
          {(
            [
              ["black", "#1C191F", "Charcoal"],
              ["coral", "#EC5A33", "Coral"],
              ["lilac", "#8574EA", "Lilac"],
            ] as [CardColor, string, string][]
          ).map(([key, swatch, name]) => (
            <label key={key} className={cx("flex cursor-pointer items-center gap-2 rounded-[12px] px-3 py-2 text-[13px] ring-1 ring-inset transition-colors", color === key ? "bg-inset ring-ink" : "ring-line hover:bg-inset")}>
              <input type="radio" name="card-color" value={key} checked={color === key} onChange={() => setColor(key)} className="sr-only" />
              <span className="h-4 w-6 rounded-[4px]" style={{ background: swatch }} />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-1 flex justify-end gap-2">
        <Button variant="soft" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" icon={<Plus size={15} strokeWidth={2} />}>
          Issue card
        </Button>
      </div>
    </form>
  );
}
