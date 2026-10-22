"use client";

import { Modal } from "@/components/ui/overlay";
import { cx } from "@/lib/cx";
import { NavLink, RAIL_NAV, TOP_NAV, isActive, useNav } from "./nav";

/** Compact navigation sheet for narrow screens where the pill nav and rail don't fit. */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useNav();
  const extra = RAIL_NAV.filter((r) => !TOP_NAV.some((t) => t.href === r.href));
  const links = [...TOP_NAV.map((t) => ({ label: t.label, href: t.href })), ...extra.map((r) => ({ label: r.label, href: r.href }))];
  return (
    <Modal open={open} onClose={onClose} title="Navigate" width={380}>
      <nav aria-label="All sections" className="grid grid-cols-2 gap-2">
        {links.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <NavLink
              key={l.href}
              href={l.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={cx(
                "rounded-[14px] px-4 py-3 text-[14px] font-medium transition-colors",
                active ? "bg-pill text-pill-fg" : "bg-inset text-ink hover:bg-inset-strong",
              )}
            >
              {l.label}
            </NavLink>
          );
        })}
      </nav>
    </Modal>
  );
}
