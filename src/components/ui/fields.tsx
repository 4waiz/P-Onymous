"use client";

import { Search } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export const SearchInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; wrapperClassName?: string }
>(function SearchInput({ label, className, wrapperClassName, ...rest }, ref) {
  return (
    <label
      className={cx(
        "group flex h-[44px] items-center gap-2.5 rounded-full bg-card px-4 ring-1 ring-inset ring-line transition-shadow focus-within:ring-line-strong",
        wrapperClassName,
      )}
    >
      <Search size={16} strokeWidth={1.8} className="shrink-0 text-ink-2" aria-hidden />
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        type="search"
        className={cx(
          "h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-2 [&::-webkit-search-cancel-button]:hidden",
          className,
        )}
        {...rest}
      />
    </label>
  );
});

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[12px] text-neg">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string | null; prefix?: string }
>(function TextInput({ label, hint, error, prefix, className, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={inputId}>
      <div
        className={cx(
          "flex h-[46px] items-center gap-2 rounded-[14px] bg-inset px-4 ring-1 ring-inset transition-shadow focus-within:ring-2",
          error ? "ring-neg/60 focus-within:ring-neg/70" : "ring-transparent focus-within:ring-accent/50",
        )}
      >
        {prefix && <span className="text-[15px] text-muted">{prefix}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cx("h-full min-w-0 flex-1 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-muted-2", className)}
          {...rest}
        />
      </div>
    </Field>
  );
});

export function SelectInput({
  label,
  hint,
  children,
  id,
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <Field label={label} hint={hint} htmlFor={selectId}>
      <select
        id={selectId}
        className={cx(
          "h-[46px] rounded-[14px] bg-inset px-4 text-[14.5px] text-ink outline-none ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-accent/50",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
}
