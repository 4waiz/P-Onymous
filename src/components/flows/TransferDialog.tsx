"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, Check, Send } from "lucide-react";
import { useState } from "react";
import { InitialsAvatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SelectInput, TextInput } from "@/components/ui/fields";
import { Modal, useToast } from "@/components/ui/overlay";
import { money, nowStamp } from "@/lib/format";
import { useAppState, useDispatch } from "@/lib/store";

export const TRANSFER_CAP = 50000;

export function validateAmount(raw: string, balance: number): string | null {
  if (raw.trim() === "") return "Enter an amount.";
  const v = Number(raw);
  if (!Number.isFinite(v) || v <= 0) return "Amount must be greater than $0.";
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return "Use at most two decimal places.";
  if (v > TRANSFER_CAP) return `Demo transfers are capped at ${money(TRANSFER_CAP, 0)}.`;
  if (v > balance) return "That’s more than your available balance.";
  return null;
}

type Step = "form" | "confirm" | "done";

/**
 * Send money: pick recipient + amount → review → confirm → success.
 * Purely local demo state — the copy makes clear nothing real is moved.
 */
export function TransferDialog({
  open,
  onClose,
  contactId,
  amount,
  startAt = "form",
}: {
  open: boolean;
  onClose: () => void;
  contactId?: string;
  amount?: number;
  startAt?: Step;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Send money" description="Demo transfer — no real funds move." width={440}>
      {open && <TransferBody key={`${contactId}-${amount}-${startAt}`} onClose={onClose} contactId={contactId} amount={amount} startAt={startAt} />}
    </Modal>
  );
}

function TransferBody({
  onClose,
  contactId,
  amount,
  startAt,
}: {
  onClose: () => void;
  contactId?: string;
  amount?: number;
  startAt: Step;
}) {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const [step, setStep] = useState<Step>(startAt);
  const [recipient, setRecipient] = useState(contactId ?? state.contacts[0]?.id ?? "");
  const [raw, setRaw] = useState(amount ? String(amount) : "");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState<number | null>(null);
  const contact = state.contacts.find((c) => c.id === recipient);
  const error = validateAmount(raw, state.balanceUSD);
  const value = Number(raw) || 0;

  const confirm = () => {
    if (!contact || error) return;
    dispatch({ type: "sendTransfer", contactId: contact.id, amount: value, note, at: nowStamp() });
    setSent(value);
    setStep("done");
    toast({ title: `Sent ${money(value)} to ${contact.name}`, description: "Recorded in Activity · demo only" });
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === "form" && (
        <motion.form
          key="form"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (!error && contact) setStep("confirm");
          }}
        >
          <SelectInput label="Recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)}>
            {state.contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.bank} •• {c.last4}
              </option>
            ))}
          </SelectInput>
          <TextInput
            label="Amount (USD)"
            prefix="$"
            inputMode="decimal"
            data-autofocus
            value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/[^\d.]/g, ""))}
            onBlur={() => setTouched(true)}
            error={touched ? error : null}
            hint={`Available ${money(state.balanceUSD)}`}
            placeholder="0.00"
          />
          <TextInput label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What’s it for?" maxLength={60} />
          <div className="mt-1 flex justify-end gap-2">
            <Button variant="soft" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Review</Button>
          </div>
        </motion.form>
      )}

      {step === "confirm" && contact && (
        <motion.div
          key="confirm"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex flex-col items-center rounded-[20px] bg-inset px-5 py-6 text-center">
            <InitialsAvatar initials={contact.initials} gradient={contact.gradient} size={56} />
            <p className="mt-3 text-[13px] text-muted">You’re sending</p>
            <p className="num text-[34px] font-semibold tracking-[-0.02em]">{money(value)}</p>
            <p className="text-[13.5px] text-ink-2">
              to <span className="font-medium text-ink">{contact.name}</span> · {contact.bank} •• {contact.last4}
            </p>
            {note && <p className="mt-2 text-[12.5px] text-muted">“{note}”</p>}
          </div>
          {error && (
            <p role="alert" className="mt-3 text-[12.5px] text-neg">
              {error}
            </p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-[13px]">
            <dt className="text-muted">Fee</dt>
            <dd className="text-right">$0.00</dd>
            <dt className="text-muted">Balance after</dt>
            <dd className="num text-right">{money(Math.max(0, state.balanceUSD - value))}</dd>
          </dl>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="soft" onClick={() => (startAt === "confirm" ? onClose() : setStep("form"))}>
              {startAt === "confirm" ? "Cancel" : "Back"}
            </Button>
            <Button data-autofocus disabled={!!error} onClick={confirm} icon={<Send size={15} strokeWidth={1.9} />}>
              Confirm & send
            </Button>
          </div>
        </motion.div>
      )}

      {step === "done" && contact && (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-4 text-center"
        >
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.05 }}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-pos-bg text-pos"
          >
            <Check size={30} strokeWidth={2.2} />
          </motion.span>
          <p className="mt-4 text-[18px] font-semibold">Transfer sent</p>
          <p className="mt-1 text-[13.5px] text-muted">
            {money(sent ?? 0)} is on its way to {contact.name}.
          </p>
          <Button className="mt-6 w-full" data-autofocus onClick={onClose}>
            Done
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function RequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Request money" description="Sends a demo payment request." width={420}>
      {open && <RequestBody onClose={onClose} />}
    </Modal>
  );
}

function RequestBody({ onClose }: { onClose: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const [from, setFrom] = useState(state.contacts[0]?.id ?? "");
  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const value = Number(raw) || 0;
  const error =
    raw.trim() === "" ? "Enter an amount." : value <= 0 ? "Amount must be greater than $0." : value > TRANSFER_CAP ? `Requests are capped at ${money(TRANSFER_CAP, 0)}.` : null;
  const contact = state.contacts.find((c) => c.id === from);

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (error || !contact) return;
        dispatch({ type: "requestMoney", contactId: contact.id, amount: value, note, at: nowStamp() });
        toast({ title: `Requested ${money(value)} from ${contact.name}`, description: "Shows as Pending in Activity", tone: "info" });
        onClose();
      }}
    >
      <SelectInput label="From" value={from} onChange={(e) => setFrom(e.target.value)}>
        {state.contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectInput>
      <TextInput
        label="Amount (USD)"
        prefix="$"
        inputMode="decimal"
        data-autofocus
        value={raw}
        placeholder="0.00"
        onChange={(e) => setRaw(e.target.value.replace(/[^\d.]/g, ""))}
        onBlur={() => setTouched(true)}
        error={touched ? error : null}
      />
      <TextInput label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={60} placeholder="Dinner, rent, invoice…" />
      <div className="mt-1 flex justify-end gap-2">
        <Button variant="soft" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" icon={<ArrowDownLeft size={15} strokeWidth={1.9} />}>
          Send request
        </Button>
      </div>
    </form>
  );
}
