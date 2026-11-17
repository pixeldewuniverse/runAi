"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { TONE_CLASS } from "@/lib/labels";

type Variant = "primary" | "ghost" | "accent" | "danger";

const VARIANT: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-2",
  accent: "bg-dew text-ink hover:brightness-95",
  ghost: "bg-transparent text-ink border border-line hover:bg-paper-2",
  danger: "bg-transparent text-danger border border-danger/30 hover:bg-danger/5",
};

export function Button({
  variant = "primary",
  loading,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50 ${VARIANT[variant]} ${className}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Chip({ tone, children }: { tone: keyof typeof TONE_CLASS; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASS[tone]}`}>
      {tone === "work" ? <span className="size-1.5 animate-pulse rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function PageTitle({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="label">{kicker}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{children}</p>;
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="label">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
