"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

/** Classes d'un bouton, réutilisables sur un <Link>. */
export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.97]",
    {
      primary: "bg-accent text-accent-ink shadow-lg shadow-accent/25 hover:brightness-110",
      secondary: "border border-line bg-surface-solid text-ink hover:bg-surface-2",
      ghost: "text-muted hover:bg-surface-2 hover:text-ink",
    }[variant],
    { sm: "h-9 px-3.5 text-sm", md: "h-11 px-5 text-sm", lg: "h-13 px-7 text-base" }[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  active,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={clsx(
        "grid size-10 place-items-center rounded-full transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        active ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      className={clsx(
        "flex flex-wrap gap-1 rounded-2xl bg-surface-2 p-1",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={clsx(
              "relative flex-1 rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
              selected ? "text-accent-ink" : "text-muted hover:text-ink",
            )}
          >
            {selected && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-xl bg-accent shadow"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  help?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {help && <span className="mt-0.5 block text-xs text-muted">{help}</span>}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-surface-2 ring-1 ring-line",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 600, damping: 35 }}
          className={clsx(
            "absolute top-0.5 size-5 rounded-full bg-white shadow",
            checked ? "end-0.5" : "start-0.5",
          )}
        />
      </button>
    </label>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  format,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  disabled?: boolean;
}) {
  return (
    <div className={clsx("flex items-center gap-3", disabled && "pointer-events-none opacity-50")}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 flex-1 cursor-pointer accent-[var(--accent)]"
      />
      <span className="tabular min-w-16 rounded-lg bg-surface-2 px-2 py-1 text-center text-sm font-bold">
        {format(value)}
      </span>
    </div>
  );
}

export function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-xs font-bold tracking-wide text-muted uppercase">{label}</div>
        {help && <p className="mt-0.5 text-xs text-muted">{help}</p>}
      </div>
      {children}
    </div>
  );
}
