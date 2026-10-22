"use client";

import { motion } from "framer-motion";
import { cx } from "@/lib/cx";

/** Coral switch with a sprung knob — matches the Auto-save and Card controls toggles. */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-[26px] w-[44px] shrink-0 items-center rounded-full p-[3px] transition-[background-color,box-shadow,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-accent" : "bg-track shadow-[inset_0_0_0_1px_var(--line-strong)]",
        className,
      )}
    >
      <motion.span
        initial={false}
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 700, damping: 34 }}
        className="block h-[20px] w-[20px] rounded-full bg-white shadow-[0_1px_3px_rgba(26,23,28,0.22)]"
      />
    </button>
  );
}
