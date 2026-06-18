"use client";

import { ChevronRight } from "lucide-react";
import type { SearchResultItem } from "@/types/search";
import { sectorVisual } from "./BestResultCard";

function cleanName(s: string) {
  return s.replace(/^salaires?\s+/i, "").trim() || s;
}
function eur(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}
function subtitle(it: SearchResultItem) {
  const parts =
    it.type === "personne_nom"
      ? [it.subCategory || it.category, it.country]
      : [it.company, it.city || it.country];
  return parts.filter(Boolean).join(" · ");
}

export function SimilarResults({
  items,
  onPick,
}: {
  items: SearchResultItem[];
  onPick: (term: string) => void;
}) {
  if (!items?.length) return null;

  return (
    <aside className="lg:sticky lg:top-24">
      <h3 className="mb-3 px-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate">
        Résultats proches
      </h3>
      <div className="flex flex-col gap-3">
        {items.slice(0, 5).map((it) => {
          const name = cleanName(it.displayName);
          const sub = subtitle(it);
          const sv = sectorVisual(it);
          const amount = it.salaryTotalEur ? eur(it.salaryTotalEur) : "—";
          return (
            <button
              key={it.id}
              onClick={() => onPick(name)}
              className="group flex w-full items-center gap-3.5 rounded-2xl border border-line bg-white p-4 text-left shadow-soft transition hover:-translate-y-[2px] hover:border-[#d7dceb] hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: sv.tint, color: sv.color }}
              >
                <sv.Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold leading-snug text-ink">{name}</span>
                {sub && (
                  <span className="mt-1 block truncate text-[12.5px] leading-relaxed text-slate">{sub}</span>
                )}
              </span>

              <span className="flex shrink-0 items-center gap-2 self-center pl-1">
                <span className="text-right leading-tight">
                  <span className="block whitespace-nowrap text-[14.5px] font-bold tabular-nums text-ink">
                    {amount}
                  </span>
                  <span className="text-[11px] text-slate-soft">/ an</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-soft transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
