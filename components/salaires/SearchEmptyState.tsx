"use client";

import { Search, SearchX, ShieldAlert } from "lucide-react";

export function SearchEmptyState({
  variant,
  query,
}: {
  variant: "initial" | "empty" | "blocked";
  query?: string;
}) {
  const isBlocked = variant === "blocked";
  const isEmpty = variant === "empty";
  const Icon = isBlocked ? ShieldAlert : isEmpty ? SearchX : Search;
  const title = isBlocked
    ? "Cette recherche n’est pas disponible"
    : isEmpty
      ? `Aucun résultat pour « ${query} »`
      : "Commencez votre recherche";
  const text = isBlocked
    ? "Essayez plutôt un métier ou une personnalité."
    : isEmpty
      ? "Vérifiez l’orthographe ou essayez un intitulé plus simple — ou explorez un secteur ci-dessus."
      : "Tapez un métier ou une personnalité, ou choisissez un exemple ci-dessus.";

  return (
    <div className="mx-auto max-w-[640px] rounded-3xl border border-dashed border-line bg-white/70 px-6 py-12 text-center backdrop-blur">
      <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${isBlocked ? "bg-[#FFE5EA] text-[#C0264A]" : "bg-brand-tint text-brand-dark"}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="mt-4 font-display text-[20px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-[440px] text-[14.5px] leading-[1.55] text-slate">{text}</p>
    </div>
  );
}
