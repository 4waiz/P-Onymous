"use client";

import { motion } from "framer-motion";
import { Bell, Download, Mail, Moon, RotateCcw, ShieldCheck, Sun, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { UserAvatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectInput, TextInput } from "@/components/ui/fields";
import { Modal, useToast } from "@/components/ui/overlay";
import { Toggle } from "@/components/ui/Toggle";
import { useNav } from "@/components/shell/nav";
import { cx } from "@/lib/cx";
import { useAppState, useDispatch } from "@/lib/store";
import { setTheme, useTheme } from "@/lib/theme";
import type { Profile } from "@/lib/types";
import { CardTitle, PageHeader } from "../PageHeader";
import { AccountWorldPanel } from "./SecondaryWorlds";

export function AccountPage() {
  const state = useAppState();
  return (
    <div>
      <PageHeader title="Account" subtitle="Your profile, security and preferences — all in one calm place." />
      <AccountWorldPanel />
      <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-[1.25fr_1fr]">
        <ProfileForm key={JSON.stringify(state.profile)} profile={state.profile} />
        <div className="flex flex-col gap-[24px]">
          <Preferences />
          <DataPanel />
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [draft, setDraft] = useState(profile);
  const [submitted, setSubmitted] = useState(false);
  const errors = {
    name: draft.name.trim().length < 2 ? "Enter your name." : null,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) ? null : "Enter a valid email address.",
    phone: /^[+\d][\d\s-]{6,}$/.test(draft.phone) ? null : "Enter a valid phone number.",
  };
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  return (
    <Panel at={0.1} contentAt={0.25} className="p-[24px]">
      <Reveal className="flex items-center gap-4">
        <UserAvatar size={64} />
        <div className="min-w-0">
          <p className="text-[19px] font-semibold tracking-[-0.01em]">{profile.name}</p>
          <p className="text-[13px] text-muted">{profile.email}</p>
        </div>
        <Pill tone="pos" className="ml-auto">
          Verified
        </Pill>
      </Reveal>
      <form
        className="mt-6 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (Object.values(errors).some(Boolean)) return;
          dispatch({ type: "updateProfile", patch: { name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone.trim(), country: draft.country } });
          toast({ title: "Profile saved" });
        }}
      >
        <Reveal at={0.05} className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Display name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={submitted ? errors.name : null} maxLength={32} />
          <TextInput label="Email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} error={submitted ? errors.email : null} />
          <TextInput label="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} error={submitted ? errors.phone : null} />
          <SelectInput label="Country" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })}>
            {["Bangladesh", "India", "United Kingdom", "United States", "Germany", "Singapore"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </Reveal>
        <Reveal at={0.1} className="flex justify-end gap-2 pt-1">
          <Button variant="soft" disabled={!dirty} onClick={() => setDraft(profile)}>
            Discard
          </Button>
          <Button type="submit" disabled={!dirty}>
            Save changes
          </Button>
        </Reveal>
      </form>
    </Panel>
  );
}

const PREFS: { key: keyof Profile; title: string; body: string; icon: LucideIcon }[] = [
  { key: "twoFactor", title: "Two-factor sign-in", body: "Ask for a code on new devices.", icon: ShieldCheck },
  { key: "emailAlerts", title: "Email alerts", body: "Payments, requests and security notices.", icon: Mail },
  { key: "pushAlerts", title: "Push notifications", body: "Instant alerts on this device.", icon: Bell },
  { key: "weeklyDigest", title: "Weekly digest", body: "A Monday summary of your money.", icon: Mail },
];

function Preferences() {
  const { profile } = useAppState();
  const dispatch = useDispatch();
  const theme = useTheme();
  return (
    <Panel at={0.15} contentAt={0.3} className="p-[22px]">
      <Reveal className="flex items-center justify-between">
        <CardTitle>Preferences</CardTitle>
        <div className="flex h-[34px] items-center rounded-full bg-well p-[3px]" role="radiogroup" aria-label="Theme">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={theme === t}
              onClick={() => setTheme(t)}
              className={cx("relative flex h-[28px] items-center gap-1.5 rounded-full px-3 text-[12px] transition-colors", theme === t ? "text-ink" : "text-muted")}
            >
              {theme === t && <motion.span layoutId="acct-theme" className="absolute inset-0 rounded-full bg-card shadow-card" transition={{ type: "spring", stiffness: 460, damping: 36 }} />}
              <span className="relative flex items-center gap-1.5">
                {t === "light" ? <Sun size={13} /> : <Moon size={13} />}
                {t === "light" ? "Light" : "Dark"}
              </span>
            </button>
          ))}
        </div>
      </Reveal>
      <ul className="mt-3">
        {PREFS.map((p, i) => {
          const Icon = p.icon;
          const on = Boolean(profile[p.key]);
          return (
            <li key={p.key} className={cx(i > 0 && "border-t border-line")}>
              <Reveal at={0.05 + i * 0.05} className="flex items-center gap-[14px] py-[12px]">
                <span className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] bg-well text-ink-2">
                  <Icon size={15} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{p.title}</p>
                  <p className="mt-[3px] text-[11.5px] text-muted">{p.body}</p>
                </div>
                <Toggle checked={on} label={p.title} onChange={(v) => dispatch({ type: "updateProfile", patch: { [p.key]: v } })} />
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function DataPanel() {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const { navigate } = useNav();
  const [confirm, setConfirm] = useState(false);
  return (
    <Panel at={0.2} contentAt={0.35} className="p-[22px]">
      <Reveal>
        <CardTitle>Demo data</CardTitle>
        <p className="mt-1 text-[12.5px] text-muted">Everything you change is saved only in this browser.</p>
      </Reveal>
      <Reveal at={0.05} className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="soft"
          icon={<Download size={15} strokeWidth={1.8} />}
          onClick={() => {
            const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "71codes-demo-data.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast({ title: "Exported demo data", description: "71codes-demo-data.json" });
          }}
        >
          Export JSON
        </Button>
        <Button variant="soft" className="text-neg" icon={<RotateCcw size={15} strokeWidth={1.8} />} onClick={() => setConfirm(true)}>
          Reset demo
        </Button>
      </Reveal>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset all demo data?" description="Contacts, goals, cards and transfers return to the original seed." width={400}>
        <div className="flex justify-end gap-2">
          <Button variant="soft" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            data-autofocus
            onClick={() => {
              dispatch({ type: "reset" });
              setConfirm(false);
              toast({ title: "Demo data reset" });
              navigate("/");
            }}
          >
            Reset
          </Button>
        </div>
      </Modal>
    </Panel>
  );
}
