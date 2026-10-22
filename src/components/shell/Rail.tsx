"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CircleHelp, LogOut, Moon, Sun } from "lucide-react";
import { useState, type ReactNode } from "react";
import { EASE_OUT, useMotionProfile } from "@/components/motion/timing";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/overlay";
import { cx } from "@/lib/cx";
import { useDispatch } from "@/lib/store";
import { setTheme, useTheme } from "@/lib/theme";
import { NavLink, RAIL_NAV, isActive, useNav } from "./nav";
import { ShellReveal, useCut, useShellEntrance } from "./ShellReveal";

function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tip relative flex">
      {children}
      <span
        role="presentation"
        className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-40 -translate-y-1/2 translate-x-[-4px] whitespace-nowrap rounded-[10px] bg-pill px-2.5 py-1.5 text-[12px] font-medium text-pill-fg opacity-0 shadow-pop transition-all duration-200 group-hover/tip:translate-x-0 group-hover/tip:opacity-100 group-focus-within/tip:translate-x-0 group-focus-within/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

/** Icons fade in one by one, top to bottom (0.6–1.0s in the film). */
function RailIcon({ index, children }: { index: number; children: ReactNode }) {
  const entrance = useShellEntrance();
  const profile = useMotionProfile();
  const reduced = useReducedMotion();
  return (
    <motion.span
      className="relative z-10 flex"
      initial={entrance && !reduced ? { opacity: 0, scale: 0.6, filter: "blur(3px)" } : false}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      transition={{ delay: (0.6 + index * 0.06) * profile.tempo, duration: 0.35 * profile.durationScale, ease: EASE_OUT }}
    >
      {children}
    </motion.span>
  );
}

export function Rail() {
  const { pathname } = useNav();
  const cut = useCut();
  const entrance = useShellEntrance();
  const profile = useMotionProfile();
  const theme = useTheme();
  const dispatch = useDispatch();
  const [helpOpen, setHelpOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const activeIdx = RAIL_NAV.findIndex((i) => isActive(pathname, i.href));
  const [lastIdx, setLastIdx] = useState(activeIdx);
  if (activeIdx >= 0 && activeIdx !== lastIdx) setLastIdx(activeIdx);
  const pillIdx = activeIdx >= 0 ? activeIdx : lastIdx;

  const item = "relative flex h-[42px] w-[42px] items-center justify-center rounded-full outline-none";

  return (
    <aside className="hidden w-[44px] shrink-0 flex-col md:flex" aria-label="Sidebar">
      {/* Theme affordance */}
      <ShellReveal at={0.28} y={-4} className="flex flex-col items-center gap-[6px] rounded-full bg-card p-[1px] py-[4px] shadow-float">
        {(["light", "dark"] as const).map((t) => (
          <Tip key={t} label={t === "light" ? "Light theme" : "Dark theme"}>
            <button
              type="button"
              aria-label={t === "light" ? "Use light theme" : "Use dark theme"}
              aria-pressed={theme === t}
              onClick={() => setTheme(t)}
              className={cx(item, "text-ink-2 transition-colors hover:text-ink")}
            >
              {theme === t && (
                <motion.span
                  layoutId="theme-pill"
                  className="absolute inset-[3px] rounded-full bg-inset"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">
                {t === "light" ? <Sun size={18} strokeWidth={1.6} /> : <Moon size={18} strokeWidth={1.6} />}
              </span>
            </button>
          </Tip>
        ))}
      </ShellReveal>

      {/* Destinations */}
      <ShellReveal at={0.34} y={-4} className="mt-[75px]">
        <nav aria-label="Sections" className="flex flex-col items-center gap-[8px] rounded-full bg-card p-[1px] py-[6px] shadow-float">
          {RAIL_NAV.map((r, i) => {
            const active = i === activeIdx;
            const Icon = r.icon;
            return (
              <Tip key={r.id} label={r.label}>
                <NavLink
                  href={r.href}
                  aria-label={r.label}
                  aria-current={active ? "page" : undefined}
                  data-rail={r.id}
                  className={cx(item, "transition-colors duration-300", active ? "text-pill-fg" : "text-ink-2 hover:text-ink")}
                >
                  {i === pillIdx && pillIdx >= 0 && (
                    <motion.span
                      layoutId="rail-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-pill"
                      initial={entrance ? { opacity: 0, scale: 0.5 } : false}
                      animate={{ opacity: activeIdx >= 0 ? 1 : 0, scale: 1 }}
                      transition={
                        cut
                          ? { duration: 0 }
                          : {
                              layout: { type: "spring", stiffness: 380, damping: 34 },
                              opacity: { duration: 0.2, delay: entrance ? 0.88 * profile.tempo : 0 },
                              scale: { type: "spring", stiffness: 420, damping: 24, delay: entrance ? 0.88 * profile.tempo : 0 },
                            }
                      }
                    />
                  )}
                  <RailIcon index={i}>
                    <Icon size={18} strokeWidth={1.6} />
                  </RailIcon>
                </NavLink>
              </Tip>
            );
          })}
        </nav>
      </ShellReveal>

      {/* Help + sign out */}
      <ShellReveal at={0.36} y={4} className="mt-[54px] flex flex-col items-center gap-[8px] rounded-full bg-card p-[1px] py-[4px] shadow-float">
        <Tip label="Help & shortcuts">
          <button type="button" aria-label="Help and shortcuts" onClick={() => setHelpOpen(true)} className={cx(item, "text-ink-2 hover:text-ink")}>
            <RailIcon index={7}>
              <CircleHelp size={18} strokeWidth={1.6} />
            </RailIcon>
          </button>
        </Tip>
        <Tip label="Sign out">
          <button type="button" aria-label="Sign out" onClick={() => setSignOutOpen(true)} className={cx(item, "text-ink-2 hover:text-ink")}>
            <RailIcon index={8}>
              <LogOut size={18} strokeWidth={1.6} />
            </RailIcon>
          </button>
        </Tip>
      </ShellReveal>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Help & shortcuts" description="Everything here is a local demo — try it freely.">
        <ul className="grid gap-2.5 text-[13.5px]">
          {[
            ["Ctrl / ⌘ + K", "Search pages, contacts and transactions"],
            ["Esc", "Close any dialog or menu"],
            ["Tab", "Move through controls (focus ring shows where you are)"],
            ["Tap the card", "Flip your virtual card on Manage"],
          ].map(([k, v]) => (
            <li key={k} className="flex items-center justify-between gap-4 rounded-[12px] bg-inset px-3 py-2.5">
              <kbd className="rounded-[7px] bg-card px-2 py-1 text-[12px] font-medium shadow-card">{k}</kbd>
              <span className="text-right text-muted">{v}</span>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={signOutOpen} onClose={() => setSignOutOpen(false)} title="Sign out of 71Codes?" description="Your demo data stays saved in this browser.">
        <div className="flex justify-end gap-2">
          <Button variant="soft" onClick={() => setSignOutOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="dark"
            data-autofocus
            onClick={() => {
              setSignOutOpen(false);
              dispatch({ type: "signOut" });
            }}
          >
            Sign out
          </Button>
        </div>
      </Modal>
    </aside>
  );
}
