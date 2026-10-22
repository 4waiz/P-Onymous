"use client";

import type { ReactNode } from "react";
import { BlurText } from "@/components/motion/BlurText";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Page heading block: large light-medium title that resolves word by word, muted subtitle,
 * optional black pill action on the right (aligned to the subtitle line as in the film).
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  subtitleAt = 0.3,
  actionsAt = 0.3,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  subtitleAt?: number;
  actionsAt?: number;
}) {
  return (
    <div className="mb-[29px] flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-[34px] font-medium leading-[1.12] tracking-[-0.025em] text-ink md:text-[42px]">
          <BlurText text={title} at={0.02} />
        </h1>
        <Reveal at={subtitleAt} y={4} blur={4}>
          <p className="mt-[9px] text-[14px] tracking-[-0.003em] text-ink-2/80 md:text-[16px]">{subtitle}</p>
        </Reveal>
      </div>
      {actions && (
        <Reveal at={actionsAt} y={6} className="flex items-center gap-3 pb-[4px]">
          {actions}
        </Reveal>
      )}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-[18px] font-medium tracking-[-0.015em] text-ink ${className}`}>{children}</h2>;
}
