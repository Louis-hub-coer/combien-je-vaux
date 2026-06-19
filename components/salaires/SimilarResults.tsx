"use client";

import { ChevronRight } from "lucide-react";
import type { SearchResultItem } from "@/types/search";
import { formatEuro, broadCategory } from "@/lib/display";
import { sectorVisual } from "./BestResultCard";

function cleanName(s: string) {
  return s.replace(/^salaires?\s+/i, "").trim() || s;
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
          const name = cleanName(it.displayName); // titre générique (nom)
          const sub = broadCategory(it); // sous-titre générique (catégorie large)
          const sv = sectorVisual(it);
          return (
            <button
              key={it.id}
              onClick={() => onPick(name)}
              className="group flex w-full items-center gap-3.5 rounded-2xl border border-line bg-white p-4 text-left shadow-soft transition duration-200 hover:-translate-y-[2px] hover:border-[#d7dceb] hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105"
                style={{ background: sv.tint, color: sv.color }}
              >
                <sv.Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-semibold leading-snug text-ink">{name}</span>
                <span className="mt-1 block truncate text-[12.5px] leading-relaxed text-slate">{sub}</span>
              </span>

              <span className="flex shrink-0 items-center gap-1.5 self-center">
                <span className="whitespace-nowrap text-[14px] font-bold text-ink [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.12em" }}>
                  {it.salaryTotalEur != null ? formatEuro(it.salaryTotalEur) : "—"}
                  <span className="ml-1 font-normal text-slate-soft" style={{ wordSpacing: "normal" }}>/ an</span>
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
