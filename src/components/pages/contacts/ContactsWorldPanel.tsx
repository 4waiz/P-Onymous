"use client";

import { Building2, Send, Star, User } from "lucide-react";
import { useCallback, useMemo } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { InitialsAvatar } from "@/components/ui/Avatar";
import { WorldPanel, type WorldFocusSpec } from "@/components/world/WorldPanel";
import { dayMonth, money } from "@/lib/format";
import { useAppState } from "@/lib/store";

const whole = (v: number) => money(v, 0);

/**
 * Your payment network in 3D. Clicking a home or shop selects that contact in Quick transfer
 * below; sending money launches a drone to them.
 */
export function ContactsWorldPanel({ onPick }: { onPick: (contactId: string) => void }) {
  const { contacts } = useAppState();
  const sent = useMemo(() => contacts.reduce((s, c) => s + (c.lastSentAmount ?? 0), 0), [contacts]);
  const last = useMemo(
    () => [...contacts].filter((c) => c.lastSentAt).sort((a, b) => (b.lastSentAt ?? "").localeCompare(a.lastSentAt ?? ""))[0],
    [contacts],
  );
  const favourites = contacts.filter((c) => c.favourite).length;

  const focus = useCallback(
    (id: string): WorldFocusSpec | null => {
      if (id === "hq") {
        return {
          title: "71Codes HQ",
          tone: "coral",
          icon: <Send size={17} strokeWidth={1.8} />,
          rows: [
            ["Contacts", String(contacts.length)],
            ["Favourites", String(favourites)],
            ["Businesses", String(contacts.filter((c) => c.kind === "Business").length)],
          ],
        };
      }
      const c = contacts.find((x) => `c-${x.id}` === id);
      if (!c) return null;
      return {
        title: c.name,
        tone: c.kind === "Business" ? "purple" : "blue",
        icon: c.kind === "Business" ? <Building2 size={18} strokeWidth={1.8} /> : <User size={18} strokeWidth={1.8} />,
        rows: [
          ["Bank", `${c.bank} •• ${c.last4}`],
          ["Last sent", c.lastSentAmount != null && c.lastSentAt ? `${money(c.lastSentAmount, 0)} · ${dayMonth(c.lastSentAt)}` : "—"],
          ["Favourite", c.favourite ? "Yes ★" : "No"],
        ],
        footer: <p className="text-[12px] text-muted">Selected in Quick transfer below ↓</p>,
      };
    },
    [contacts, favourites],
  );

  return (
    <WorldPanel
      scene="contacts"
      eyebrow="Your network"
      at={0.06}
      focus={focus}
      onSelect={(id) => {
        if (id?.startsWith("c-")) onPick(id.slice(2));
      }}
      tags={contacts.slice(0, 12).map((c) => ({
        id: `tag-${c.id}`,
        anchor: `c-${c.id}`,
        content: (
          <span className="mb-1.5 flex flex-col items-center">
            <span className="relative">
              <InitialsAvatar initials={c.initials} gradient={c.gradient} size={26} className="ring-2 ring-white shadow-md" />
              {c.favourite && <Star size={10} className="absolute -right-1 -top-1 fill-[#F4B400] text-[#F4B400]" />}
            </span>
          </span>
        ),
      }))}
      cards={[
        { id: "fav", anchor: "hq", side: "left", tone: "coral", label: "Favourites", value: `${favourites} people` },
        { id: "sent", anchor: "hq", side: "left", tone: "blue", label: "Sent recently", value: <AnimatedNumber value={sent} format={whole} at={0.3} /> },
        {
          id: "last",
          anchor: last ? `c-${last.id}` : "hq",
          side: "right",
          tone: "purple",
          label: "Last transfer",
          value: <span className="block max-w-[150px] truncate text-[16px]">{last ? `${last.short} · ${money(last.lastSentAmount ?? 0, 0)}` : "—"}</span>,
        },
        { id: "count", anchor: "hq", side: "right", tone: "green", label: "Network", value: `${contacts.length} contacts` },
      ]}
    />
  );
}
