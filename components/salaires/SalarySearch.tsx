"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search, X, Loader2, RotateCcw,
  Star, Briefcase, Stethoscope, Dumbbell, Cpu,
  Banknote, HeartPulse, Gavel, Lightbulb, Megaphone, Building2, Factory, Trophy, Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SearchResponse } from "@/types/search";
import { BestResultCard } from "./BestResultCard";
import { SimilarResults } from "./SimilarResults";
import { SearchEmptyState } from "./SearchEmptyState";

type Status = "idle" | "loading" | "done" | "error";

const PLACEHOLDER = "Tapez un métier, une entreprise ou une personnalité…";

const SUGGESTIONS: { label: string; icon: LucideIcon; color: string; tint: string }[] = [
  { label: "Mbappé", icon: Star, color: "#FF4D67", tint: "#FFE5EA" },
  { label: "IShowSpeed", icon: Star, color: "#FF4D67", tint: "#FFE5EA" },
  { label: "Trader Goldman Sachs", icon: Briefcase, color: "#7C3AED", tint: "#EEE7FD" },
  { label: "Cardiologue libéral", icon: Stethoscope, color: "#06B6D4", tint: "#DEF7FB" },
  { label: "Prof de sport", icon: Dumbbell, color: "#00C389", tint: "#E1F7EF" },
  { label: "Data scientist Google Paris", icon: Cpu, color: "#2F6BFF", tint: "#EAF1FF" },
];

const CATEGORIES: { label: string; icon: LucideIcon; color: string; tint: string; query: string }[] = [
  { label: "Finance", icon: Banknote, color: "#7C3AED", tint: "#EEE7FD", query: "trader" },
  { label: "Tech / Data", icon: Cpu, color: "#00C389", tint: "#E1F7EF", query: "data scientist" },
  { label: "Santé", icon: HeartPulse, color: "#06B6D4", tint: "#DEF7FB", query: "médecin" },
  { label: "Droit", icon: Gavel, color: "#2F6BFF", tint: "#EAF1FF", query: "avocat" },
  { label: "Conseil", icon: Lightbulb, color: "#F59E0B", tint: "#FEF1D8", query: "consultant" },
  { label: "Marketing", icon: Megaphone, color: "#FF4D67", tint: "#FFE5EA", query: "responsable marketing" },
  { label: "Immobilier", icon: Building2, color: "#2F6BFF", tint: "#EAF1FF", query: "agent immobilier" },
  { label: "Industrie / ingénierie", icon: Factory, color: "#F59E0B", tint: "#FEF1D8", query: "ingénieur" },
  { label: "Sport", icon: Trophy, color: "#00C389", tint: "#E1F7EF", query: "footballeur" },
  { label: "Fonction publique", icon: Landmark, color: "#7C3AED", tint: "#EEE7FD", query: "enseignant" },
];

export function SalarySearch() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [resp, setResp] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (term: string) => {
    const query = term.trim();
    if (query.length < 2) {
      setResp(null);
      setStatus("idle");
      setSubmitted("");
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStatus("loading");
    setSubmitted(query);
    try {
      // Appel de l'API serveur (le CSV ne quitte jamais le serveur).
      const res = await fetch(`/api/salaires/search?q=${encodeURIComponent(query)}&limit=10`, {
        signal: ac.signal,
      });
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as SearchResponse;
      setResp(data);
      setStatus("done");
      window.history.replaceState(null, "", `${window.location.pathname}?q=${encodeURIComponent(query)}`);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q") ?? "";
    if (initial) setQ(initial);
    else inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResp(null);
      setStatus("idle");
      setSubmitted("");
      return;
    }
    const t = setTimeout(() => runSearch(term), 350);
    return () => clearTimeout(t);
  }, [q, runSearch]);

  const pick = useCallback(
    (term: string) => {
      setQ(term);
      runSearch(term);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [runSearch],
  );

  const clear = () => {
    setQ("");
    setResp(null);
    setStatus("idle");
    setSubmitted("");
    inputRef.current?.focus();
  };

  const showResults = (status === "done" || (status === "loading" && !!resp?.best)) && !!resp?.best;

  return (
    <div className="mx-auto w-full">
      <div className="mx-auto max-w-[940px]">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(q);
          }}
          className="flex items-center gap-3 rounded-[22px] border border-line bg-white py-3 pl-6 pr-3 shadow-[0_10px_22px_rgba(15,23,42,.07),0_46px_84px_-30px_rgba(124,58,237,.42)] transition focus-within:border-[#c7b6f2] focus-within:shadow-[0_12px_26px_rgba(15,23,42,.1),0_54px_96px_-30px_rgba(124,58,237,.55)]"
        >
          {status === "loading" ? (
            <Loader2 className="h-6 w-6 shrink-0 animate-spin text-brand" aria-hidden />
          ) : (
            <Search className="h-6 w-6 shrink-0 text-slate" aria-hidden />
          )}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            inputMode="search"
            autoComplete="off"
            aria-label="Rechercher un salaire"
            placeholder={PLACEHOLDER}
            className="min-w-0 flex-1 bg-transparent text-[17px] font-medium leading-normal text-ink outline-none placeholder:font-normal placeholder:text-slate-soft [&::-webkit-search-cancel-button]:appearance-none"
          />
          {q && (
            <button
              type="button"
              onClick={clear}
              aria-label="Effacer la recherche"
              className="shrink-0 rounded-full p-2 text-slate transition hover:bg-surface hover:text-ink"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          )}
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-brand px-6 py-3.5 text-[15px] font-semibold text-ink shadow-[0_12px_26px_-10px_rgba(0,195,137,.55)] transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Rechercher
          </button>
        </form>
      </div>

      {/* Chips d'exemples — une seule ligne sur desktop */}
      <div className="mx-auto mt-4 flex max-w-[1080px] flex-wrap items-center justify-center gap-2.5 lg:flex-nowrap lg:overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => pick(s.label)}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-semibold text-ink transition hover:-translate-y-[1px] hover:border-[#d7dceb] hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md"
                style={{ background: s.tint, color: s.color }}
              >
                <Icon className="h-[13px] w-[13px]" aria-hidden />
              </span>
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="mt-10" aria-live="polite">
        {status === "idle" && <Categories onPick={pick} />}

        {status === "loading" && !resp && <ResultsSkeleton />}

        {status === "error" && (
          <p className="mx-auto max-w-[680px] rounded-2xl border border-line bg-white p-5 text-center text-[15px] text-slate">
            La recherche n&apos;a pas abouti. Réessayez dans un instant.
          </p>
        )}

        {showResults && resp?.best && (
          <div className={status === "loading" ? "opacity-60" : ""}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[13.5px] text-slate">
                Résultat pour <span className="font-semibold text-ink">«&nbsp;{submitted}&nbsp;»</span>
              </p>
              <button
                onClick={clear}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate transition hover:-translate-y-[1px] hover:border-[#d7dceb] hover:text-ink hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Nouvelle recherche
              </button>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
              <BestResultCard key={resp.best.id} item={resp.best} fallbackUsed={resp.fallbackUsed} />
              <SimilarResults items={resp.results} onPick={pick} />
            </div>
          </div>
        )}

        {status === "done" && resp && !resp.best && (
          <SearchEmptyState variant="empty" query={submitted} />
        )}
      </div>
    </div>
  );
}

function Categories({ onPick }: { onPick: (term: string) => void }) {
  return (
    <div className="mx-auto max-w-[940px]">
      <h2 className="mb-4 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-slate">
        Explorer par secteur
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              onClick={() => onPick(c.query)}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-line bg-white/90 px-3 py-5 text-center backdrop-blur transition hover:-translate-y-[2px] hover:border-[#d7dceb] hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105"
                style={{ background: c.tint, color: c.color }}
              >
                <Icon className="h-[22px] w-[22px]" aria-hidden />
              </span>
              <span className="text-[13.5px] font-semibold leading-tight text-ink">{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
      <div className="animate-pulse rounded-3xl border border-line bg-white p-7">
        <div className="h-5 w-28 rounded-full bg-surface" />
        <div className="mt-4 h-9 w-2/3 rounded-lg bg-surface" />
        <div className="mt-5 h-24 w-full rounded-2xl bg-surface" />
        <div className="mt-5 h-4 w-1/2 rounded bg-surface" />
      </div>
      <div className="hidden animate-pulse space-y-3 lg:block">
        <div className="h-[76px] rounded-2xl border border-line bg-white" />
        <div className="h-[76px] rounded-2xl border border-line bg-white" />
        <div className="h-[76px] rounded-2xl border border-line bg-white" />
      </div>
    </div>
  );
}
