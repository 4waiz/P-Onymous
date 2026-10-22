"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, type AnchorHTMLAttributes, type ReactNode } from "react";
import {
  CalendarDays,
  Layers,
  LayoutGrid,
  Mail,
  ReceiptText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export const TOP_NAV = [
  { label: "Overview", href: "/" },
  { label: "Activity", href: "/activity" },
  { label: "Manage", href: "/manage" },
  { label: "Program", href: "/program" },
  { label: "Account", href: "/account" },
  { label: "Reports", href: "/reports" },
] as const;

export const RAIL_NAV: { label: string; href: string; icon: LucideIcon; id: string }[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: LayoutGrid },
  { id: "schedule", label: "Schedule", href: "/schedule", icon: CalendarDays },
  { id: "inbox", label: "Inbox", href: "/inbox", icon: Mail },
  { id: "reports", label: "Statements", href: "/reports", icon: ReceiptText },
  { id: "contacts", label: "Contacts", href: "/contacts", icon: Users },
  { id: "savings", label: "Savings & Goals", href: "/savings", icon: Layers },
  { id: "settings", label: "Settings", href: "/account", icon: Settings },
];

export interface NavApi {
  pathname: string;
  navigate: (href: string) => void;
  mode: "app" | "showcase";
}

const NavContext = createContext<NavApi>({ pathname: "/", navigate: () => {}, mode: "app" });

export function useNav() {
  return useContext(NavContext);
}

/** Router-backed navigation for the real app. */
export function RouterNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const navigate = useCallback((href: string) => router.push(href), [router]);
  const value = useMemo<NavApi>(() => ({ pathname, navigate, mode: "app" }), [pathname, navigate]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

/** Memory navigation (the /showcase stage drives this from its scene script). */
export function MemoryNavProvider({
  pathname,
  navigate,
  children,
}: {
  pathname: string;
  navigate: (href: string) => void;
  children: ReactNode;
}) {
  const value = useMemo<NavApi>(() => ({ pathname, navigate, mode: "showcase" }), [pathname, navigate]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function NavLink({
  href,
  children,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  const nav = useNav();
  if (nav.mode === "app") {
    return (
      <Link href={href} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        e.preventDefault();
        nav.navigate(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
