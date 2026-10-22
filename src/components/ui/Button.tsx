"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";

type Variant = "dark" | "soft" | "ghost" | "outline" | "accent" | "danger" | "white";
type Size = "lg" | "md" | "sm" | "xs";

const VARIANTS: Record<Variant, string> = {
  dark: "bg-pill text-pill-fg hover:bg-pill-hover",
  soft: "bg-inset text-ink hover:bg-inset-strong",
  ghost: "bg-transparent text-ink hover:bg-inset",
  outline: "bg-card text-ink ring-1 ring-inset ring-line-strong hover:bg-inset",
  accent: "bg-accent text-white hover:bg-accent-deep",
  danger: "bg-neg text-white hover:brightness-95",
  white: "bg-card text-ink hover:bg-inset",
};

const SIZES: Record<Size, string> = {
  lg: "h-[47px] px-6 text-[15px] gap-2.5",
  md: "h-[40px] px-5 text-[14px] gap-2",
  sm: "h-[34px] px-4 text-[13px] gap-1.5",
  xs: "h-[28px] px-3 text-[12px] gap-1.5",
};

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "dark", size = "md", icon, iconRight, className, children, type = "button", disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-medium tracking-[-0.005em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </motion.button>
  );
});

export const IconButton = forwardRef<
  HTMLButtonElement,
  Omit<HTMLMotionProps<"button">, "children"> & { label: string; children: ReactNode; size?: number }
>(function IconButton({ label, children, className, size = 40, type = "button", ...rest }, ref) {
  return (
    <motion.button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      style={{ width: size, height: size }}
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center rounded-full text-ink transition-colors duration-200 hover:bg-inset",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
