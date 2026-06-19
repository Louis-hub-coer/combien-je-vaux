"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search, X, Loader2, RotateCcw, ChevronRight, TrendingUp, Flame, Layers, BarChart3, Compass,
  Star, Briefcase, Stethoscope, Dumbbell, Cpu,
  Banknote, HeartPulse, Gavel, Lightbulb, Megaphone, Building2, Factory, Trophy, Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SearchResponse } from "@/types/search";
import { formatEuro } from "@/lib/display";
import { BestResultCard } from "./BestResultCard";
import { SimilarResults } from "./SimilarResults";
import { SearchEmptyState } from "./SearchEmptyState";

type Status = "idle" | "loading" | "done" | "error";

const PLACEHOLDER = "Tapez un métier, une entreprise ou une personnalité…";

const SUGGESTIONS: { label: string; icon: LucideIcon; color: string; tint: string }[] = [
  { label: "Mbappé", icon: Star, color: "#FF4D67", tint: "#FFE5EA" },
  { label: "Trader", icon: Briefcase, color: "#7C3AED", tint: "#EEE7FD" },
  { label: "Cardiologue", icon: Stethoscope, color: "#06B6D4", tint: "#DEF7FB" },
  { label: "Prof de sport", icon: Dumbbell, color: "#00C389", tint: "#E1F7EF" },
  { label: "Data scientist", icon: Cpu, color: "#2F6BFF", tint: "#EAF1FF" },
  { label: "IShowSpeed", icon: Star, color: "#FF4D67", tint: "#FFE5EA" },
];

const CATEGORIES: { key: string; label: string; blurb: string; icon: LucideIcon; color: string; tint: string }[] = [
  { key: "finance", label: "Finance", blurb: "Traders, M&A, gestion, BFI", icon: Banknote, color: "#7C3AED", tint: "#EEE7FD" },
  { key: "tech", label: "Tech / Data", blurb: "Dev, data, cloud, IA", icon: Cpu, color: "#00C389", tint: "#E1F7EF" },
  { key: "sante", label: "Santé", blurb: "Médecins, soins, spécialités", icon: HeartPulse, color: "#06B6D4", tint: "#DEF7FB" },
  { key: "droit", label: "Droit", blurb: "Avocats, notariat, justice", icon: Gavel, color: "#2F6BFF", tint: "#EAF1FF" },
  { key: "conseil", label: "Conseil", blurb: "Stratégie, audit, advisory", icon: Lightbulb, color: "#F59E0B", tint: "#FEF1D8" },
  { key: "marketing", label: "Marketing", blurb: "Comm, digital, growth", icon: Megaphone, color: "#FF4D67", tint: "#FFE5EA" },
  { key: "immobilier", label: "Immobilier", blurb: "Agents, gestion, promotion", icon: Building2, color: "#2F6BFF", tint: "#EAF1FF" },
  { key: "industrie", label: "Industrie / ingénierie", blurb: "Production, ingénieurs", icon: Factory, color: "#F59E0B", tint: "#FEF1D8" },
  { key: "sport", label: "Sport", blurb: "Athlètes, coachs, clubs", icon: Trophy, color: "#00C389", tint: "#E1F7EF" },
  { key: "public", label: "Fonction publique", blurb: "Sécurité, défense, État", icon: Landmark, color: "#7C3AED", tint: "#EEE7FD" },
];

type SectorItem = { name: string; sub: string; total: number | null };
type SectorOverview = {
  key: string;
  label: string;
  top: SectorItem[];
  popular: SectorItem[];
  accessible: SectorItem[];
  stat: { medianEur: number | null; topName: string; popularName: string; count: number };
};

export function SalarySearch() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [resp, setResp] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const [sectorKey, setSectorKey] = useState<string | null>(null);

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

  const scrollToExplore = () =>
    setTimeout(() => exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  // Bouton « Explorer par secteur » : si une recherche est affichée, on revient à l'exploration.
  const goExplore = () => {
    if (resp?.best || status === "done") clear();
    scrollToExplore();
  };
  // Depuis le bloc compact sous les résultats : ouvrir un secteur précis.
  const openSectorFromResults = (key: string) => {
    clear();
    setSectorKey(key);
    scrollToExplore();
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

      {/* Accès secondaire : explorer par secteur (scrolle / ouvre le bloc) */}
      <div className="mt-3 flex justify-center">
        <button
          onClick={goExplore}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-slate transition hover:text-ink"
        >
          <Compass className="h-3.5 w-3.5 text-brand-dark" aria-hidden /> Explorer les salaires par secteur
        </button>
      </div>

      <div className="mt-9" aria-live="polite">
        {status === "idle" && (
          <div ref={exploreRef}>
            <SectorExplorer active={sectorKey} onActiveChange={setSectorKey} onPick={pick} />
          </div>
        )}

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
                {resp?.companyLabel ? (
                  <>Salaires associés à <span className="font-semibold text-ink">«&nbsp;{resp.companyLabel}&nbsp;»</span></>
                ) : (
                  <>Résultat pour <span className="font-semibold text-ink">«&nbsp;{submitted}&nbsp;»</span></>
                )}
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
              <BestResultCard key={resp.best.id} item={resp.best} fallbackUsed={resp.fallbackUsed} query={submitted} />
              <SimilarResults items={resp.results} onPick={pick} />
            </div>
            <CompactSectors onOpen={openSectorFromResults} onExploreAll={goExplore} />
          </div>
        )}

        {status === "done" && resp && !resp.best && (
          <SearchEmptyState variant={resp.blocked ? "blocked" : "empty"} query={submitted} />
        )}
      </div>
    </div>
  );
}

const eur = (n: number | null) => (n == null ? "—" : formatEuro(n));

function SectorExplorer({
  active,
  onActiveChange,
  onPick,
}: {
  active: string | null;
  onActiveChange: (k: string | null) => void;
  onPick: (t: string) => void;
}) {
  const [data, setData] = useState<SectorOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const acRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!active) { setData(null); return; }
    setShowAll(false); setData(null); setLoading(true);
    acRef.current?.abort();
    const ac = new AbortController(); acRef.current = ac;
    fetch(`/api/salaires/sectors?key=${encodeURIComponent(active)}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: SectorOverview | null) => { setData(d); setLoading(false); })
      .catch((e) => { if ((e as Error).name !== "AbortError") setLoading(false); });
    return () => ac.abort();
  }, [active]);

  const label = CATEGORIES.find((c) => c.key === active)?.label ?? "";
  const hasMore = !!data && (data.top.length > 3 || data.popular.length > 3 || data.accessible.length > 2);

  return (
    <div className="mx-auto max-w-[940px]">
      <h2 className="mb-1 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-slate">Explorer par secteur</h2>
      <p className="mb-4 text-center text-[13px] text-slate-soft">Choisissez un secteur pour voir les vrais salaires et des fiches cliquables.</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const on = active === c.key;
          return (
            <button
              key={c.key}
              onClick={() => onActiveChange(on ? null : c.key)}
              aria-pressed={on}
              className={`group flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                on ? "border-brand bg-brand-tint shadow-[0_12px_28px_-14px_rgba(0,195,137,.6)]" : "border-line bg-white/90 hover:-translate-y-[2px] hover:border-[#d7dceb] hover:shadow-card"
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105" style={{ background: c.tint, color: c.color }}>
                <Icon className="h-[20px] w-[20px]" aria-hidden />
              </span>
              <span className="text-[13px] font-semibold leading-tight text-ink">{c.label}</span>
              <span className="text-[11px] leading-tight text-slate-soft">{c.blurb}</span>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-5 rounded-3xl border border-line bg-white/85 p-5 backdrop-blur md:p-6">
          {loading && (
            <div className="flex items-center gap-2 text-[14px] text-slate">
              <Loader2 className="h-4 w-4 animate-spin text-brand" /> Chargement du secteur…
            </div>
          )}
          {!loading && data && (
            <>
              <StatTiles data={data} />
              <SectorList title="Top salaires" icon={TrendingUp} accent="#7C3AED" items={data.top} limit={showAll ? 5 : 3} onPick={onPick} />
              <SectorList title="Métiers populaires" icon={Flame} accent="#FF7A1A" items={data.popular} limit={showAll ? 5 : 3} onPick={onPick} />
              <SectorList title="À comparer aussi" icon={Layers} accent="#2F6BFF" items={data.accessible} limit={showAll ? 5 : 2} onPick={onPick} />
              {hasMore && (
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink transition hover:-translate-y-[1px] hover:border-[#d7dceb] hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  >
                    {showAll ? "Voir moins" : `Voir plus de salaires ${label}`}
                    <ChevronRight className={`h-4 w-4 transition ${showAll ? "-rotate-90" : "rotate-90"}`} aria-hidden />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatTiles({ data }: { data: SectorOverview }) {
  const top = data.top[0];
  const pop = data.popular[0];
  const Amount = ({ v }: { v: number | null }) => (
    <span className="text-[17px] font-extrabold leading-none text-ink [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.12em" }}>
      {eur(v)}
      <span className="ml-1 text-[11px] font-normal text-slate-soft" style={{ wordSpacing: "normal" }}>/ an</span>
    </span>
  );
  const Tile = ({ label, Icon, name, v, tint, color }: { label: string; Icon: LucideIcon; name: string; v: number | null; tint: string; color: string }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: tint, color }}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-soft">{label}</span>
        {name && <span className="mb-0.5 block truncate text-[12px] font-medium text-slate">{name}</span>}
        <Amount v={v} />
      </span>
    </div>
  );
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Tile label="Salaire médian" Icon={BarChart3} name={`${data.stat.count} métiers`} v={data.stat.medianEur} tint="#E1F7EF" color="#00A06E" />
      {top && <Tile label="Top salaire" Icon={TrendingUp} name={top.name} v={top.total} tint="#EEE7FD" color="#7C3AED" />}
      {pop && <Tile label="Métier populaire" Icon={Flame} name={pop.name} v={pop.total} tint="#FFE9DD" color="#FF7A1A" />}
    </div>
  );
}

function SectorList({
  title, icon: Icon, accent, items, limit, onPick,
}: { title: string; icon: LucideIcon; accent: string; items: SectorItem[]; limit: number; onPick: (t: string) => void }) {
  if (!items?.length) return null;
  const shown = items.slice(0, limit);
  return (
    <div className="mt-5">
      <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate">
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} aria-hidden /> {title}
      </span>
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((it) => (
          <button
            key={it.name}
            onClick={() => onPick(it.name)}
            className="group flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 text-left transition hover:-translate-y-[1px] hover:border-[#d7dceb] hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: accent }} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold leading-tight text-ink">{it.name}</span>
              <span className="block truncate text-[11.5px] text-slate-soft">{it.sub}</span>
            </span>
            <span className="ml-auto whitespace-nowrap text-[13px] font-bold text-ink [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.12em" }}>
              {it.total != null ? formatEuro(it.total) : "—"}
              <span className="ml-1 text-[10.5px] font-normal text-slate-soft" style={{ wordSpacing: "normal" }}>/ an</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-soft transition group-hover:translate-x-0.5 group-hover:text-ink" />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Version compacte affichée sous les résultats : ne pas bloquer l'exploration. */
function CompactSectors({ onOpen, onExploreAll }: { onOpen: (k: string) => void; onExploreAll: () => void }) {
  const quick = CATEGORIES.slice(0, 5);
  return (
    <div className="mt-8 rounded-3xl border border-line bg-white/70 p-5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate">Explorer aussi par secteur</h3>
        <button onClick={onExploreAll} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-dark transition hover:gap-1.5">
          Voir tous les salaires par secteur <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {quick.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => onOpen(c.key)}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[13px] font-semibold text-ink transition hover:-translate-y-[1px] hover:border-[#d7dceb] hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: c.tint, color: c.color }}>
                <Icon className="h-[13px] w-[13px]" aria-hidden />
              </span>
              {c.label}
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
