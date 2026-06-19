"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { salaireTools } from "@/lib/salaire-tools";

/**
 * Entrée « Salaire » de la navbar : clic -> /salaire (hub), hover -> dropdown
 * premium des 4 outils. N'affecte que cette entrée ; le reste de la navbar
 * et les autres univers sont inchangés.
 */
export function SalaireNavItem({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      <Link
        href="/salaire"
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-xl px-[13px] py-2 text-[14.5px] font-medium text-slate transition hover:bg-surface hover:text-ink"
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 text-slate-soft transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </Link>

      {open && (
        <div className="absolute left-1/2 top-full z-[70] -translate-x-1/2 pt-3">
          <div className="cjv-drop w-[368px] rounded-2xl border border-line bg-white p-2 shadow-[0_24px_60px_-22px_rgba(5,9,24,.45)]">
            {salaireTools.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.key}
                  href={t.href}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105" style={{ background: t.tint, color: t.color }}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold leading-tight text-ink">{t.title}</span>
                    <span className="block truncate text-[12px] text-slate-soft">{t.tagline}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-soft opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
