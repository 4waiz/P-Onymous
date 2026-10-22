"use client";

import { motion } from "framer-motion";
import { Check, Coffee, Crown, Gift, Plane, Percent, Sparkles, Ticket, Users, type LucideIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { HatchedProgress } from "@/components/charts/primitives";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { Pill } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, useToast } from "@/components/ui/overlay";
import { Toggle } from "@/components/ui/Toggle";
import { int, money } from "@/lib/format";
import { useAppState, useDispatch } from "@/lib/store";
import { CardTitle, PageHeader } from "../PageHeader";

const TIERS = [
  { name: "Silver", at: 0 },
  { name: "Gold", at: 10000 },
  { name: "Platinum", at: 25000 },
];

const PROGRAMS: { id: string; title: string; body: string; icon: LucideIcon }[] = [
  { id: "cashback", title: "Everyday cashback", body: "1% back on every card payment, paid monthly.", icon: Percent },
  { id: "travel", title: "Travel boost", body: "3× points on flights, hotels and rides abroad.", icon: Plane },
  { id: "referral", title: "Invite friends", body: "2,000 points for each friend who opens a wallet.", icon: Users },
];

const PERKS: { id: string; title: string; cost: number; icon: LucideIcon; tone: string }[] = [
  { id: "coffee", title: "Coffee on us", cost: 600, icon: Coffee, tone: "#FDE7E0" },
  { id: "lounge", title: "Airport lounge pass", cost: 4800, icon: Plane, tone: "#E2EEFD" },
  { id: "voucher", title: "$50 shopping voucher", cost: 5000, icon: Gift, tone: "#FCE3EF" },
  { id: "cinema", title: "Two cinema tickets", cost: 2400, icon: Ticket, tone: "#ECE5FD" },
];

export function ProgramPage() {
  const { rewards } = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const [confirm, setConfirm] = useState<(typeof PERKS)[number] | null>(null);
  const format = useCallback((v: number) => `${int(v)}`, []);
  const tierIdx = TIERS.findLastIndex((t) => rewards.points >= t.at);
  const tier = TIERS[tierIdx];
  const next = TIERS[tierIdx + 1];
  const progress = next ? ((rewards.points - tier.at) / (next.at - tier.at)) * 100 : 100;

  return (
    <div>
      <PageHeader
        title="Program"
        subtitle="Earn points on every payment and turn them into perks you actually use."
        actions={
          <Button size="lg" className="h-[47px] px-[24px] text-[14.5px]" icon={<Sparkles size={15} strokeWidth={1.9} />} onClick={() => document.getElementById("perks")?.scrollIntoView({ behavior: "smooth" })}>
            Redeem points
          </Button>
        }
      />
      <div className="mb-[24px] grid grid-cols-1 gap-[24px] lg:grid-cols-3">
        <Panel at={0.1} contentAt={0.25} className="relative overflow-hidden p-[22px] lg:col-span-2">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(234,85,47,0.16),transparent_65%)]" />
          <Reveal className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-[0_10px_20px_-10px_rgba(234,85,47,0.8)]">
              <Crown size={18} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[13px] text-muted">Your tier</p>
              <p className="text-[18px] font-semibold tracking-[-0.01em]">{tier.name} member</p>
            </div>
          </Reveal>
          <Reveal at={0.05} className="mt-6 flex items-end gap-3">
            <AnimatedNumber value={rewards.points} format={format} at={0.1} className="text-[44px] font-[650] leading-none tracking-[-0.03em]" />
            <span className="mb-1.5 text-[14px] text-muted">points</span>
          </Reveal>
          <div className="mt-6 max-w-[520px]">
            <HatchedProgress value={progress} at={0.2} height={11} label={`Progress to ${next?.name ?? "top tier"}`} />
            <Reveal at={0.25} className="mt-3 flex justify-between text-[12px] text-muted">
              <span>{tier.name}</span>
              <span>{next ? `${int(next.at - rewards.points)} points to ${next.name}` : "Top tier reached"}</span>
            </Reveal>
          </div>
        </Panel>
        <Panel at={0.15} contentAt={0.3} className="p-[22px]">
          <Reveal>
            <CardTitle>This month</CardTitle>
          </Reveal>
          <dl className="mt-5 grid gap-4">
            {[
              ["Cashback earned", money(48.2)],
              ["Points earned", `+${int(1860)}`],
              ["Perks redeemed", String(rewards.redeemed.length)],
            ].map(([k, v], i) => (
              <Reveal key={k} at={0.05 + i * 0.05} className="flex items-center justify-between rounded-[14px] bg-well px-4 py-3">
                <dt className="text-[13px] text-ink-2">{k}</dt>
                <dd className="num text-[15px] font-semibold">{v}</dd>
              </Reveal>
            ))}
          </dl>
        </Panel>
      </div>

      <Panel at={0.2} contentAt={0.35} className="mb-[24px] p-[22px]">
        <Reveal>
          <CardTitle>Programs</CardTitle>
          <p className="mt-1 text-[12.5px] text-muted">Switch on the ways you want to earn.</p>
        </Reveal>
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {PROGRAMS.map((p, i) => {
            const on = rewards.enrolled.includes(p.id);
            const Icon = p.icon;
            return (
              <li key={p.id}>
                <Reveal at={0.05 + i * 0.06} className="flex h-full items-start gap-3 rounded-[16px] bg-well p-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-card text-ink-2 shadow-card">
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold">{p.title}</p>
                    <p className="mt-1 text-[12px] text-muted">{p.body}</p>
                  </div>
                  <Toggle
                    checked={on}
                    label={p.title}
                    onChange={() => {
                      dispatch({ type: "toggleEnroll", id: p.id });
                      toast({ title: `${p.title} ${on ? "paused" : "enabled"}`, tone: on ? "info" : "success" });
                    }}
                  />
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Panel>

      <section id="perks" aria-label="Perks">
        <Reveal at={0.3} className="mb-4 flex items-center justify-between">
          <CardTitle>Perks</CardTitle>
          <span className="text-[12.5px] text-muted">{int(rewards.points)} points available</span>
        </Reveal>
        <ul className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 xl:grid-cols-4">
          {PERKS.map((p, i) => {
            const Icon = p.icon;
            const done = rewards.redeemed.includes(p.id);
            const affordable = rewards.points >= p.cost;
            return (
              <motion.li key={p.id} whileHover={{ y: -3 }}>
                <Panel at={0.32 + i * 0.05} className="flex h-full flex-col p-[20px]">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-[13px] text-ink" style={{ background: p.tone }}>
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <p className="mt-4 text-[14.5px] font-semibold">{p.title}</p>
                  <p className="mt-1 text-[12.5px] text-muted">{int(p.cost)} points</p>
                  <div className="mt-5">
                    {done ? (
                      <Pill tone="pos" className="h-[34px] w-full justify-center gap-1.5 rounded-full text-[12.5px]">
                        <Check size={13} strokeWidth={2.2} /> Redeemed
                      </Pill>
                    ) : (
                      <Button size="sm" variant={affordable ? "dark" : "soft"} disabled={!affordable} className="w-full" onClick={() => setConfirm(p)}>
                        {affordable ? "Redeem" : `Need ${int(p.cost - rewards.points)} more`}
                      </Button>
                    )}
                  </div>
                </Panel>
              </motion.li>
            );
          })}
        </ul>
      </section>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm ? `Redeem ${confirm.title}?` : "Redeem"} description={confirm ? `Uses ${int(confirm.cost)} of your ${int(rewards.points)} points.` : undefined} width={400}>
        <div className="flex justify-end gap-2">
          <Button variant="soft" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            data-autofocus
            onClick={() => {
              if (!confirm) return;
              dispatch({ type: "redeemReward", id: confirm.id, cost: confirm.cost });
              toast({ title: `${confirm.title} redeemed`, description: "Check your inbox for the (demo) voucher." });
              setConfirm(null);
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}
