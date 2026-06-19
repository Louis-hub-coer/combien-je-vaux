"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";
import { SALARY_SEARCH_PLACEHOLDER } from "@/lib/constants";

/**
 * Barre de recherche de la homepage : volontairement sobre côté texte
 * (placeholder fixe). Le mouvement vient d'effets visuels discrets — halo qui
 * respire derrière l'icône + fine ligne de scan — pas de texte qui se tape.
 * Les effets plus explicites de moteur restent sur la page /salaires.
 */
export function SearchBarTyping() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const submit = () => {
    const q = value.trim();
    if (!q) return;
    router.push(`/salaires?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      role="search"
      aria-label="Rechercher un salaire"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="relative flex items-center gap-3 overflow-hidden rounded-[18px] border border-line bg-white py-[9px] pl-[18px] pr-[9px] shadow-[0_4px_10px_rgba(15,23,42,.05),0_30px_60px_-26px_rgba(0,195,137,.5)] transition hover:border-[#bfe7da] hover:shadow-[0_6px_14px_rgba(15,23,42,.07),0_36px_64px_-24px_rgba(0,195,137,.6)]"
    >
      {/* Ligne de scan discrète (bas de la barre) */}
      <span aria-hidden className="cjv-scan" />

      {/* Icône loupe + halo qui respire */}
      <span className="relative flex h-[22px] w-[22px] shrink-0 items-center justify-center">
        <span aria-hidden className="cjv-iconglow" />
        <Search className="relative h-[22px] w-[22px] text-slate" />
      </span>

      <span className="relative flex min-w-0 flex-1 items-center overflow-hidden text-left text-[16.5px]">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder={SALARY_SEARCH_PLACEHOLDER}
          aria-label="Rechercher un salaire"
          className="min-w-0 flex-1 bg-transparent font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-soft [&::-webkit-search-cancel-button]:appearance-none"
        />
      </span>
      <button
        type="submit"
        className="inline-flex shrink-0 items-center justify-center rounded-[14px] bg-brand px-[22px] py-[13px] text-[16px] font-semibold text-ink shadow-[0_12px_26px_-10px_rgba(0,195,137,.55)] transition hover:-translate-y-px hover:bg-brand-dark"
      >
        Rechercher
      </button>
    </form>
  );
}
