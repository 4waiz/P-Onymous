import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Small label pinned above a 3D object (goal %, contact initials, due dates). */
export function WorldChip({ children, tone, className }: { children: ReactNode; tone?: string; className?: string }) {
  return (
    <span className={cx("world-chip relative mb-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink", className)}>
      {tone && <span className="h-[7px] w-[7px] rounded-full" style={{ background: tone }} />}
      {children}
      <span aria-hidden className="absolute -bottom-[4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-inherit" style={{ background: "inherit" }} />
    </span>
  );
}
