"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Plus, Send, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { TRANSFER_CAP, TransferDialog, validateAmount } from "@/components/flows/TransferDialog";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { EASE_OUT, useTiming } from "@/components/motion/timing";
import { InitialsAvatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SearchInput, SelectInput, TextInput } from "@/components/ui/fields";
import { Modal, useToast } from "@/components/ui/overlay";
import { cx } from "@/lib/cx";
import { dayMonth, money } from "@/lib/format";
import { useAppState, useDispatch } from "@/lib/store";
import type { Contact } from "@/lib/types";
import { CardTitle, PageHeader } from "../PageHeader";

const PRESETS = [50, 100, 250, 500];

export function ContactsPage() {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="The people and businesses you pay the most, one tap away."
        subtitleAt={0.25}
        actionsAt={0.25}
        actions={
          <Button size="lg" className="h-[47px] px-[24px] text-[14.5px]" icon={<Plus size={16} strokeWidth={2} />} onClick={() => setAddOpen(true)}>
            Add contact
          </Button>
        }
      />
      <QuickTransfer onAddNew={() => setAddOpen(true)} />
      <ContactDirectory />
      <AddContactDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick transfer                                                     */
/* ------------------------------------------------------------------ */

function QuickTransfer({ onAddNew }: { onAddNew: () => void }) {
  const { contacts, balanceUSD } = useAppState();
  const favourites = contacts.filter((c) => c.favourite).slice(0, 6);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = favourites.find((c) => c.id === selectedId) ?? favourites[0] ?? null;
  const [raw, setRaw] = useState("100");
  const [touched, setTouched] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const error = validateAmount(raw, balanceUSD);
  const value = Number(raw) || 0;
  const { delay, dur, still } = useTiming();

  return (
    <Panel at={0.05} contentAt={0.12} className="mb-[28px] flex flex-col gap-6 px-[20px] pb-[21px] pt-[25px] lg:min-h-[289px] lg:flex-row lg:items-stretch lg:justify-between">
      <div className="min-w-0">
        <Reveal>
          <CardTitle>Quick transfer</CardTitle>
          <p className="mt-[9px] text-[12.5px] text-muted">Pick a favourite, choose an amount, done.</p>
        </Reveal>
        <LayoutGroup id="quick-transfer">
          <div className="mt-[22px] flex flex-wrap gap-[12px] pl-[4px]" role="radiogroup" aria-label="Recipient">
            {favourites.map((c, i) => {
              const active = selected?.id === c.id;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`Send to ${c.name}`}
                  onClick={() => setSelectedId(c.id)}
                  initial={still ? false : { opacity: 0, scale: 0.6, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
                  transition={{ delay: delay(0.04 + i * 0.08), duration: dur(0.4), ease: EASE_OUT, scale: { type: "spring", stiffness: 380, damping: 22, delay: delay(0.04 + i * 0.08) } }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex w-[80px] flex-col items-center rounded-[16px] pb-[12px] pt-[10px] outline-none"
                >
                  {active && (
                    <motion.span
                      layoutId="qt-selected-bg"
                      className="absolute inset-0 rounded-[16px] bg-inset"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">
                    {active && (
                      <motion.span
                        layoutId="qt-selected-ring"
                        className="absolute -inset-[4px] rounded-full ring-[1.5px] ring-accent"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <InitialsAvatar initials={c.initials} gradient={c.gradient} size={54} className={cx(active && "ring-2 ring-card")} />
                  </span>
                  <span className="relative mt-[10px] max-w-full truncate text-[12px] text-ink-2">{c.short}</span>
                </motion.button>
              );
            })}
            <motion.button
              type="button"
              onClick={onAddNew}
              aria-label="Add a new contact"
              initial={still ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay(0.04 + favourites.length * 0.08), duration: dur(0.4), ease: EASE_OUT }}
              whileTap={{ scale: 0.95 }}
              className="group flex w-[80px] flex-col items-center rounded-[16px] pb-[12px] pt-[10px]"
            >
              <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full border-[1.5px] border-dashed border-muted-2 text-muted transition-colors group-hover:border-ink group-hover:text-ink">
                <Plus size={18} strokeWidth={1.6} />
              </span>
              <span className="mt-[10px] text-[12px] text-ink-2">New</span>
            </motion.button>
          </div>
        </LayoutGroup>
      </div>

      {/* Composer */}
      <Reveal at={0.1} y={10} className="w-full shrink-0 rounded-[20px] bg-inset px-[16px] pb-[17px] pt-[18px] lg:-mt-[3px] lg:w-[476px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (!error && selected) setConfirmOpen(true);
          }}
          aria-label="Quick transfer composer"
        >
          <div className="flex items-center gap-[11px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {selected && (
                <motion.span
                  key={selected.id}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                >
                  <InitialsAvatar initials={selected.initials} gradient={selected.gradient} size={37} />
                </motion.span>
              )}
            </AnimatePresence>
            <div className="min-w-0">
              <p className="text-[10.5px] leading-[14px] text-muted-2">Sending to</p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={selected?.id ?? "none"}
                  initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="mt-[5px] truncate text-[13.5px] font-semibold leading-[18px] text-ink"
                >
                  {selected ? selected.name : "Pick a favourite"}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <label className={cx("mt-[16px] flex h-[58px] items-center gap-[8px] rounded-[16px] bg-card px-[18px] ring-1 ring-inset transition-shadow focus-within:ring-2", touched && error ? "ring-neg/60" : "ring-transparent focus-within:ring-accent/40")}>
            <span className="text-[24px] font-light text-muted">$</span>
            <span className="sr-only">Amount in US dollars</span>
            <input
              inputMode="decimal"
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value.replace(/[^\d.]/g, ""));
                setTouched(true);
              }}
              aria-invalid={!!(touched && error)}
              aria-describedby="qt-error"
              className="num h-full min-w-0 flex-1 bg-transparent text-[28px] font-semibold tracking-[-0.02em] text-ink outline-none"
            />
            <span className="text-[11.5px] text-muted-2">USD</span>
          </label>
          <p id="qt-error" role={touched && error ? "alert" : undefined} className={cx("h-0 overflow-visible text-[11.5px] text-neg", !(touched && error) && "sr-only")}>
            {touched && error ? error : ""}
          </p>

          <div className="mt-[14px] flex items-center gap-[6px]" role="radiogroup" aria-label="Preset amounts">
            {PRESETS.map((p) => {
              const active = value === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setRaw(String(p));
                    setTouched(true);
                  }}
                  className={cx("relative h-[30px] rounded-full px-[14px] text-[12px] font-medium transition-colors duration-200", active ? "text-pill-fg" : "text-ink-2 hover:text-ink")}
                >
                  {active && (
                    <motion.span
                      layoutId="qt-preset"
                      className="absolute inset-0 rounded-full bg-pill"
                      transition={{ type: "spring", stiffness: 480, damping: 36 }}
                    />
                  )}
                  <span className="relative">${p}</span>
                </button>
              );
            })}
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={!selected}
            initial={still ? false : { backgroundColor: "#8f8b92" }}
            animate={{ backgroundColor: "var(--pill)" }}
            transition={{ delay: delay(0.25), duration: dur(0.3) }}
            className="mt-[14px] flex h-[46px] w-full items-center justify-center gap-[9px] rounded-full text-[14px] font-medium text-pill-fg disabled:opacity-50"
          >
            <Send size={15} strokeWidth={1.9} />
            Send {money(error ? 0 : value)}
          </motion.button>
        </form>
      </Reveal>

      <TransferDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        contactId={selected?.id}
        amount={value}
        startAt="confirm"
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  Directory: filters + search + cards                                */
/* ------------------------------------------------------------------ */

type FilterKey = "all" | "favourites" | "businesses";

function ContactDirectory() {
  const { contacts } = useAppState();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const counts = {
    all: contacts.length,
    favourites: contacts.filter((c) => c.favourite).length,
    businesses: contacts.filter((c) => c.kind === "Business").length,
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts
      .filter((c) => (filter === "favourites" ? c.favourite : filter === "businesses" ? c.kind === "Business" : true))
      .filter((c) => !q || `${c.name} ${c.handle} ${c.bank}`.toLowerCase().includes(q));
  }, [contacts, filter, query]);

  return (
    <section aria-label="Contacts directory">
      <Reveal at={0.18} className="mb-[21px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex h-[36px] items-center gap-[4px] rounded-full bg-card p-[3px] shadow-float" role="tablist" aria-label="Filter contacts">
          {(
            [
              ["all", "All"],
              ["favourites", "Favourites"],
              ["businesses", "Businesses"],
            ] as [FilterKey, string][]
          ).map(([key, label]) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(key)}
                className={cx("relative flex h-[30px] items-center gap-[7px] rounded-full px-[13px] text-[12px] transition-colors", active ? "text-pill-fg" : "text-ink-2 hover:text-ink")}
              >
                {active && (
                  <motion.span layoutId="contacts-filter" className="absolute inset-0 rounded-full bg-pill" transition={{ type: "spring", stiffness: 460, damping: 36 }} />
                )}
                <span className="relative">{label}</span>
                <span className={cx("relative inline-flex h-[16px] min-w-[18px] items-center justify-center rounded-[5px] px-1 text-[9.5px] font-medium", active ? "bg-white/15 text-pill-fg" : "bg-inset text-muted")}>
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>
        <SearchInput
          label="Search contacts"
          placeholder="Search contacts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          wrapperClassName="h-[42px] w-[242px] max-w-full bg-card/70 ring-0 focus-within:bg-card focus-within:ring-1"
        />
      </Reveal>

      <motion.ul layout className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {shown.map((c, i) => (
            <ContactCard key={c.id} contact={c} index={i} />
          ))}
        </AnimatePresence>
      </motion.ul>
      {shown.length === 0 && (
        <p className="py-14 text-center text-[13.5px] text-muted">
          No contacts match {query ? `“${query}”` : "this filter"}.
        </p>
      )}
    </section>
  );
}

function ContactCard({ contact: c, index }: { contact: Contact; index: number }) {
  const dispatch = useDispatch();
  const { delay, dur, still } = useTiming();
  return (
    <motion.li
      layout
      initial={still ? false : { opacity: 0, y: 18, scale: 0.98, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ delay: delay(0.1 + Math.min(index, 6) * 0.04), duration: dur(0.45), ease: EASE_OUT, layout: { type: "spring", stiffness: 380, damping: 34 } }}
      whileHover={{ y: -3 }}
      className="relative flex flex-col items-center rounded-[22px] bg-card px-4 pb-[18px] pt-[25px] text-center shadow-card"
    >
      <button
        type="button"
        aria-pressed={c.favourite}
        aria-label={c.favourite ? `Remove ${c.name} from favourites` : `Add ${c.name} to favourites`}
        onClick={() => dispatch({ type: "toggleFavourite", id: c.id })}
        className="absolute right-[14px] top-[14px] inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-inset"
      >
        <motion.span key={String(c.favourite)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 18 }}>
          <Star size={14} strokeWidth={1.6} className={c.favourite ? "fill-[#F4B400] text-[#F4B400]" : "text-muted-2"} />
        </motion.span>
      </button>
      <InitialsAvatar initials={c.initials} gradient={c.gradient} size={54} />
      <p className="mt-[12px] w-full truncate text-[14px] font-semibold tracking-[-0.01em] text-ink">{c.name}</p>
      <p className="mt-[4px] w-full truncate text-[11.5px] text-muted-2">{c.handle}</p>
      <span className="mt-[9px] inline-flex h-[22px] items-center rounded-[7px] bg-inset px-[9px] text-[10.5px] font-medium text-ink-2">{c.kind}</span>
      <p className="mt-[11px] w-full truncate text-[11.5px] text-ink-2">
        {c.bank} •• {c.last4}
      </p>
      <p className="mt-[4px] w-full truncate text-[10.5px] text-muted-2">
        {c.lastSentAmount != null && c.lastSentAt ? `Last sent ${money(c.lastSentAmount, 0)} · ${dayMonth(c.lastSentAt)}` : "No transfers yet"}
      </p>
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */
/*  Add contact                                                        */
/* ------------------------------------------------------------------ */

function AddContactDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add contact" description="Saved locally to this demo." width={460}>
      {open && <AddContactForm onClose={onClose} />}
    </Modal>
  );
}

function AddContactForm({ onClose }: { onClose: () => void }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [kind, setKind] = useState<"Person" | "Business">("Person");
  const [bank, setBank] = useState("Northstar Bank");
  const [last4, setLast4] = useState("");
  const [favourite, setFavourite] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const nameError = name.trim().length < 2 ? "Enter a name (2+ characters)." : null;
  const last4Error = /^\d{4}$/.test(last4) ? null : "Enter the last 4 digits of their account.";

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (nameError || last4Error) return;
        dispatch({ type: "addContact", contact: { name, handle, kind, bank, last4, favourite } });
        toast({ title: `${name.trim()} added`, description: favourite ? "Pinned to Quick transfer" : "Saved to contacts" });
        onClose();
      }}
    >
      <TextInput label="Full name" data-autofocus value={name} onChange={(e) => setName(e.target.value)} error={submitted ? nameError : null} placeholder="e.g. Farhan Rahman" maxLength={40} />
      <TextInput label="Handle or website" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@farhan or studio.co" maxLength={40} />
      <div className="grid grid-cols-2 gap-3">
        <SelectInput label="Type" value={kind} onChange={(e) => setKind(e.target.value as "Person" | "Business")}>
          <option>Person</option>
          <option>Business</option>
        </SelectInput>
        <SelectInput label="Bank" value={bank} onChange={(e) => setBank(e.target.value)}>
          <option>Northstar Bank</option>
          <option>Harbor Savings</option>
          <option>Meridian Credit</option>
          <option>Atlas Commerce</option>
        </SelectInput>
      </div>
      <TextInput
        label="Account — last 4 digits"
        inputMode="numeric"
        value={last4}
        onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
        error={submitted ? last4Error : null}
        placeholder="1234"
        hint="Demo only — never enter real account details."
      />
      <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
        <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={favourite} onChange={(e) => setFavourite(e.target.checked)} />
        Add to favourites (shows in Quick transfer)
      </label>
      <div className="mt-1 flex justify-end gap-2">
        <Button variant="soft" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" icon={<Plus size={15} strokeWidth={2} />}>
          Save contact
        </Button>
      </div>
      <p className="sr-only">Transfers are capped at {money(TRANSFER_CAP, 0)} in this demo.</p>
    </form>
  );
}
