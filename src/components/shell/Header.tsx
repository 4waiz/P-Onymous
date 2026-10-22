"use client";

import { motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  CircleAlert,
  CircleUserRound,
  Clapperboard,
  LogOut,
  Menu,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  Sun,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { BrandMark, UserAvatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { Popover, useToast } from "@/components/ui/overlay";
import { cx } from "@/lib/cx";
import { dateTime } from "@/lib/format";
import { useAppState, useDispatch } from "@/lib/store";
import { setTheme, useTheme } from "@/lib/theme";
import { CommandPalette } from "./CommandPalette";
import { NavLink, TOP_NAV, isActive, useNav } from "./nav";
import { ShellReveal, useCut } from "./ShellReveal";
import { MobileMenu } from "./MobileMenu";

const NOTE_ICONS = { payment: Wallet, security: ShieldCheck, goal: Target, request: Bell } as const;

export function Header() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-[77px] shrink-0 items-end gap-3 px-4 pb-0 md:px-[38px]">
      <div className="flex h-[58px] w-full items-center">
        <ShellReveal at={0.05} className="shrink-0">
          <NavLink
            href="/"
            className="flex h-[58px] items-center gap-[9px] rounded-full bg-card pl-[5px] pr-[22px] shadow-float"
            aria-label="71Codes home"
          >
            <BrandMark size={46} />
            <span className="text-[16.5px] font-semibold tracking-[-0.01em] text-ink">71Codes</span>
          </NavLink>
        </ShellReveal>

        <ShellReveal at={0.1} className="ml-[42px] hidden lg:block">
          <TopNav />
        </ShellReveal>

        <div className="ml-auto flex items-center gap-[18px]">
          <ShellReveal at={0.16}>
            <HeaderActions onSearch={() => setPaletteOpen(true)} />
          </ShellReveal>
          <ShellReveal at={0.12} className="hidden sm:block">
            <UserMenu />
          </ShellReveal>
          <IconButton
            label="Open menu"
            className="bg-card shadow-float lg:hidden"
            size={48}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} strokeWidth={1.7} />
          </IconButton>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

function TopNav() {
  const { pathname } = useNav();
  const cut = useCut();
  const activeIdx = TOP_NAV.findIndex((i) => isActive(pathname, i.href));
  // Remember the last active item so the pill can fade out in place (Overview → Contacts in the film)
  // and later slide from there when a top-level item becomes active again.
  const [lastIdx, setLastIdx] = useState(activeIdx);
  if (activeIdx >= 0 && activeIdx !== lastIdx) setLastIdx(activeIdx);
  const pillIdx = activeIdx >= 0 ? activeIdx : lastIdx;

  return (
    <nav aria-label="Primary" className="flex h-[58px] items-center gap-[5px] rounded-full bg-card p-[6px] shadow-float">
      {TOP_NAV.map((item, i) => {
        const active = i === activeIdx;
        return (
          <NavLink
            key={item.href}
            href={item.href}
            data-nav={item.label.toLowerCase()}
            aria-current={active ? "page" : undefined}
            className="relative flex h-[46px] items-center rounded-full px-[18px] text-[16.5px] tracking-[-0.01em] outline-none"
          >
            {i === pillIdx && pillIdx >= 0 && (
              <motion.span
                layoutId="top-nav-pill"
                aria-hidden
                className="absolute inset-0 rounded-full bg-pill"
                initial={false}
                animate={{ opacity: activeIdx >= 0 ? 1 : 0 }}
                transition={
                  cut
                    ? { duration: 0 }
                    : { layout: { type: "spring", stiffness: 420, damping: 36 }, opacity: { duration: 0.22 } }
                }
              />
            )}
            <span
              className={cx(
                "relative z-10 transition-colors duration-300",
                active ? "text-pill-fg" : "text-ink-2 hover:text-ink",
              )}
            >
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderActions({ onSearch }: { onSearch: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const { navigate } = useNav();
  const bellRef = useRef<HTMLButtonElement>(null);
  const infoRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<"bell" | "info" | null>(null);
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <div className="relative flex h-[58px] items-center gap-[9px] rounded-full bg-card px-[10px] shadow-float">
      <IconButton label="Search (Ctrl+K)" onClick={onSearch}>
        <Search size={20} strokeWidth={1.6} />
      </IconButton>

      <div className="relative">
        <IconButton
          ref={bellRef}
          label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          aria-expanded={open === "bell"}
          onClick={() => setOpen((o) => (o === "bell" ? null : "bell"))}
        >
          <Bell size={20} strokeWidth={1.6} />
          {unread > 0 && (
            <span className="absolute right-[9px] top-[8px] h-[7px] w-[7px] rounded-full bg-accent ring-2 ring-card" />
          )}
        </IconButton>
        <Popover open={open === "bell"} onClose={() => setOpen(null)} anchor={bellRef} label="Notifications" width={340}>
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <p className="text-[15px] font-semibold">Notifications</p>
            <button
              type="button"
              className="text-[12.5px] font-medium text-accent hover:underline disabled:text-muted disabled:no-underline"
              disabled={unread === 0}
              onClick={() => dispatch({ type: "readNotifications" })}
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-[340px] overflow-y-auto px-2 pb-2 v-scroll">
            {state.notifications.length === 0 && (
              <li className="px-3 py-8 text-center text-[13px] text-muted">You’re all caught up.</li>
            )}
            {state.notifications.map((n) => {
              const Icon = NOTE_ICONS[n.kind];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "readNotification", id: n.id })}
                    className="flex w-full items-start gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors hover:bg-inset"
                  >
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-inset text-ink-2">
                      <Icon size={15} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[13.5px] font-medium">
                        {n.title}
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="unread" />}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-muted">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-muted-2">{dateTime(n.at)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Popover>
      </div>

      <div className="relative">
        <IconButton
          ref={infoRef}
          label="About this demo"
          aria-expanded={open === "info"}
          onClick={() => setOpen((o) => (o === "info" ? null : "info"))}
        >
          <CircleAlert size={20} strokeWidth={1.6} />
        </IconButton>
        <Popover open={open === "info"} onClose={() => setOpen(null)} anchor={infoRef} label="About this demo" width={320}>
          <div className="p-5">
            <p className="text-[15px] font-semibold">71Codes · Dashboard V14</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
              A demo finance workspace. Balances, transfers and cards are simulated and stored only in this browser —
              no real money moves.
            </p>
            <div className="mt-4 grid gap-2">
              <Link
                href="/showcase"
                target="_top"
                onClick={() => setOpen(null)}
                className="flex items-center gap-2.5 rounded-[12px] bg-inset px-3 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-inset-strong"
              >
                <Clapperboard size={16} strokeWidth={1.8} /> Watch the V14 showcase
              </Link>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "reset" });
                  setOpen(null);
                  navigate("/");
                  toast({ title: "Demo data reset", description: "Everything is back to the seeded state." });
                }}
                className="flex items-center gap-2.5 rounded-[12px] bg-inset px-3 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-inset-strong"
              >
                <RotateCcw size={16} strokeWidth={1.8} /> Reset demo data
              </button>
            </div>
            <p className="mt-4 text-[11.5px] text-muted">
              Shortcuts: <kbd className="rounded bg-inset px-1.5 py-0.5">Ctrl K</kbd> search ·{" "}
              <kbd className="rounded bg-inset px-1.5 py-0.5">Esc</kbd> close
            </p>
          </div>
        </Popover>
      </div>
    </div>
  );
}

function UserMenu() {
  const state = useAppState();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { navigate } = useNav();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const item =
    "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[13.5px] transition-colors hover:bg-inset";

  return (
    <div className="relative">
      <motion.button
        ref={ref}
        type="button"
        whileTap={{ scale: 0.98 }}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-[58px] w-[221px] items-center gap-[10px] rounded-full bg-card pl-[9px] pr-[18px] text-left shadow-float"
      >
        <UserAvatar size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold leading-[18px] tracking-[-0.01em] text-ink">
            {state.profile.name}
          </span>
          <span className="block truncate text-[11.5px] leading-[15px] text-muted">{state.profile.email}</span>
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.8}
          className={cx("shrink-0 text-muted transition-transform duration-300", open && "rotate-180")}
        />
      </motion.button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={ref} label="Account menu" width={250}>
        <div className="p-2" role="menu">
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              navigate("/account");
            }}
          >
            <CircleUserRound size={17} strokeWidth={1.7} className="text-ink-2" /> Profile & settings
          </button>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun size={17} strokeWidth={1.7} className="text-ink-2" />
            ) : (
              <Moon size={17} strokeWidth={1.7} className="text-ink-2" />
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            className={cx(item, "text-neg")}
            onClick={() => {
              setOpen(false);
              dispatch({ type: "signOut" });
            }}
          >
            <LogOut size={17} strokeWidth={1.7} /> Sign out
          </button>
        </div>
      </Popover>
    </div>
  );
}
