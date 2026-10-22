"use client";

import { Panel, Reveal } from "@/components/motion/Reveal";
import { NavLink } from "@/components/shell/nav";
import { PageHeader } from "../PageHeader";

export function NotFoundPage() {
  return (
    <div>
      <PageHeader title="Page not found" subtitle="That address doesn’t exist in 71Codes." />
      <Panel at={0.1} className="flex flex-col items-start p-8">
        <Reveal>
          <p className="text-[14px] text-ink-2">Head back to your overview to keep going.</p>
          <NavLink href="/" className="mt-4 inline-flex h-[40px] items-center rounded-full bg-pill px-5 text-[14px] font-medium text-pill-fg">
            Go to Overview
          </NavLink>
        </Reveal>
      </Panel>
    </div>
  );
}
