"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, Reveal } from "@/components/motion/Reveal";
import { InitialsAvatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/overlay";
import { cx } from "@/lib/cx";
import { dateTime, timeOfDay, dayMonth } from "@/lib/format";
import { useAppState, useDispatch } from "@/lib/store";
import { PageHeader } from "../PageHeader";

type Box = "all" | "unread" | "starred";

export function InboxPage() {
  const { messages } = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const [box, setBox] = useState<Box>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(messages[0]?.id ?? null);
  const [replies, setReplies] = useState<Record<string, string[]>>({});
  const [draft, setDraft] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages
      .filter((m) => (box === "unread" ? !m.read : box === "starred" ? m.starred : true))
      .filter((m) => !q || `${m.from} ${m.subject} ${m.preview}`.toLowerCase().includes(q));
  }, [messages, box, query]);
  const open = messages.find((m) => m.id === openId) ?? null;
  const unread = messages.filter((m) => !m.read).length;

  return (
    <div>
      <PageHeader title="Inbox" subtitle="Messages, requests and receipts from the people you pay." />
      <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-[380px_1fr]">
        <Panel at={0.1} contentAt={0.22} className="p-[16px]">
          <Reveal className="flex h-[36px] items-center gap-1 rounded-full bg-well p-[3px]" role="tablist" aria-label="Mailbox">
            {(
              [
                ["all", "All"],
                ["unread", `Unread${unread ? ` · ${unread}` : ""}`],
                ["starred", "Starred"],
              ] as [Box, string][]
            ).map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={box === k} onClick={() => setBox(k)} className={cx("relative h-[30px] flex-1 rounded-full text-[12px] transition-colors", box === k ? "text-ink" : "text-muted")}>
                {box === k && <motion.span layoutId="inbox-box" className="absolute inset-0 rounded-full bg-card shadow-card" transition={{ type: "spring", stiffness: 460, damping: 36 }} />}
                <span className="relative">{l}</span>
              </button>
            ))}
          </Reveal>
          <Reveal at={0.04} className="mt-3">
            <SearchInput label="Search messages" placeholder="Search messages" value={query} onChange={(e) => setQuery(e.target.value)} wrapperClassName="h-[40px] bg-well ring-0" />
          </Reveal>
          <ul className="mt-2">
            {list.length === 0 && <li className="py-10 text-center text-[13px] text-muted">No messages here.</li>}
            {list.map((m, i) => (
              <li key={m.id}>
                <Reveal at={0.06 + i * 0.05}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(m.id);
                      setDraft("");
                      if (!m.read) dispatch({ type: "readMessage", id: m.id });
                    }}
                    aria-current={openId === m.id}
                    className={cx("flex w-full items-start gap-3 rounded-[16px] p-3 text-left transition-colors", openId === m.id ? "bg-well" : "hover:bg-well/60")}
                  >
                    <InitialsAvatar initials={m.initials} gradient={m.gradient} size={38} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cx("truncate text-[13.5px]", m.read ? "font-medium" : "font-semibold")}>{m.from}</span>
                        {!m.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-label="unread" />}
                        <span className="ml-auto shrink-0 text-[11px] text-muted-2">{dayMonth(m.at.slice(0, 10))}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-ink-2">{m.subject}</span>
                      <span className="mt-0.5 block truncate text-[12px] text-muted">{m.preview}</span>
                    </span>
                  </button>
                </Reveal>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel at={0.15} contentAt={0.28} className="flex min-h-[460px] flex-col p-[24px]">
          <AnimatePresence mode="wait">
            {open ? (
              <motion.article key={open.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col">
                <div className="flex items-start gap-4">
                  <InitialsAvatar initials={open.initials} gradient={open.gradient} size={48} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[19px] font-semibold tracking-[-0.01em]">{open.subject}</h2>
                    <p className="text-[12.5px] text-muted">
                      {open.from} · {dateTime(open.at)}
                    </p>
                  </div>
                  <button type="button" aria-pressed={open.starred} aria-label={open.starred ? "Unstar" : "Star"} onClick={() => dispatch({ type: "toggleStar", id: open.id })} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-well">
                    <Star size={17} strokeWidth={1.7} className={open.starred ? "fill-[#F4B400] text-[#F4B400]" : "text-muted"} />
                  </button>
                </div>
                <p className="mt-6 text-[14px] leading-relaxed text-ink-2">{open.preview}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">— {open.from.split(" ")[0]}</p>
                <div className="mt-6 grid gap-2">
                  {(replies[open.id] ?? []).map((r, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="ml-auto max-w-[80%] rounded-[16px] rounded-br-[6px] bg-pill px-4 py-2.5 text-[13.5px] text-pill-fg">
                      {r}
                    </motion.div>
                  ))}
                </div>
                <form
                  className="mt-auto flex items-end gap-2 pt-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draft.trim()) return;
                    setReplies((r) => ({ ...r, [open.id]: [...(r[open.id] ?? []), draft.trim()] }));
                    setDraft("");
                    toast({ title: `Reply sent to ${open.from}`, description: `Demo message · ${timeOfDay(open.at)}` });
                  }}
                >
                  <label className="sr-only" htmlFor="reply">
                    Reply
                  </label>
                  <textarea id="reply" value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder={`Reply to ${open.from.split(" ")[0]}…`} className="min-h-[52px] flex-1 resize-none rounded-[16px] bg-well px-4 py-3 text-[13.5px] outline-none focus:ring-2 focus:ring-accent/40" />
                  <Button type="submit" size="lg" disabled={!draft.trim()} icon={<Send size={15} strokeWidth={1.9} />}>
                    Send
                  </Button>
                </form>
              </motion.article>
            ) : (
              <p className="m-auto text-[13px] text-muted">Select a message to read it.</p>
            )}
          </AnimatePresence>
        </Panel>
      </div>
    </div>
  );
}
