import Link from "next/link";
import { Search } from "lucide-react";
import { SALARY_SEARCH_PLACEHOLDER } from "@/lib/constants";

/**
 * Barre de recherche de salaires — PLACEHOLDER VISUEL (Phase 1).
 *
 * Volontairement non branchée : aucun input, aucun état, aucune donnée.
 * Le fichier salary_master_22000_search_ready_final.csv ne doit JAMAIS être
 * chargé côté client. Le futur moteur tournera côté serveur (route handler /
 * server action) et ne renverra que les résultats filtrés. Ici, simple lien
 * stylé vers /salaires.
 */
export function SalarySearchBar({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/salaires"
      aria-label="Rechercher le salaire d'un métier ou d'une personnalité"
      className={`group flex items-center gap-3 rounded-[18px] border border-line bg-white p-2 pl-[18px] shadow-card transition hover:border-[#cfe9df] ${className}`}
    >
      <Search className="h-[22px] w-[22px] shrink-0 text-slate" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-left text-[16px] text-slate-soft">
        {SALARY_SEARCH_PLACEHOLDER}
      </span>
      <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand px-[18px] py-[11px] text-[14.5px] font-semibold text-ink shadow-brand transition group-hover:bg-brand-dark">
        Rechercher
      </span>
    </Link>
  );
}
