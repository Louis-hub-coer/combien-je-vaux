"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, ArrowRight, TrendingUp, TrendingDown, Loader2, ArrowLeftRight, Briefcase, ChevronDown, X } from "lucide-react";
import { broadCategory } from "@/lib/display";
import type { SearchResponse, SearchResultItem } from "@/types/search";

type Period = "mensuel" | "annuel";
type Basis = "brut" | "net";

interface Profile {
  name: string;
  slug: string;
  salary: number;
  diff: number;
  category: string;
  isPerson: boolean;
}
interface CompareResponse {
  annual: number | null;
  reference: Profile | null;
  between: { below: Profile | null; above: Profile | null };
  listBelow: Profile[];
  listAbove: Profile[];
}

const NBSP = "\u00A0";
const FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euro = (n: number) => FMT.format(Math.round(n)).replace(/\u202F/g, NBSP) + NBSP + "€";
const NET2GROSS = 1 / 0.78;

const EXAMPLES = [
  { label: "2 500 € / mois", amount: "2500", period: "mensuel" as Period },
  { label: "45 000 € / an", amount: "45000", period: "annuel" as Period },
  { label: "80 000 € / an", amount: "80000", period: "annuel" as Period },
  { label: "150 000 € / an", amount: "150000", period: "annuel" as Period },
  { label: "1 000 000 € / an", amount: "1000000", period: "annuel" as Period },
];
const PRO_EXAMPLES = ["Data scientist", "Trader", "Infirmier", "Professeur", "Avocat", "Commercial", "Médecin", "Contrôleur SNCF"];

// Repères de l'échelle. pos = équivalent brut annuel (pour positionner). tip = libellé officiel (brut/net précisé).
const SCALE: { label: string; pos: number; tip: string; q?: string }[] = [
  { label: "SMIC", pos: 22404, tip: "≈ 22 404 € brut / an" },
  { label: "Salaire médian", pos: Math.round(26280 * NET2GROSS), tip: "≈ 2 190 € net / mois" },
  { label: "Salaire moyen", pos: Math.round(32760 * NET2GROSS), tip: "≈ 2 730 € net / mois" },
  { label: "Cadre médian", pos: 55000, tip: "≈ 55 000 € brut / an" },
  { label: "Top 10 %", pos: Math.round(52008 * NET2GROSS), tip: "≈ 4 334 € net / mois" },
  { label: "Top 1 %", pos: Math.round(123120 * NET2GROSS), tip: "≈ 10 260 € net / mois" },
  { label: "Médecin", pos: 98000, tip: "≈ 98 000 € brut / an", q: "Médecin" },
  { label: "Trader", pos: 130000, tip: "≈ 130 000 € brut / an", q: "Trader" },
  { label: "Stars", pos: 12_000_000, tip: "très hauts revenus", q: "Mbappé" },
];
const SC_MIN = 18000;
const SC_MAX = 16_000_000;
const scalePos = (v: number) => {
  const p = (Math.log(Math.min(SC_MAX, Math.max(SC_MIN, v))) - Math.log(SC_MIN)) / (Math.log(SC_MAX) - Math.log(SC_MIN));
  return Math.min(100, Math.max(0, p * 100));
};

const parseAmount = (s: string) => {
  const n = parseFloat((s || "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
const diffLabel = (d: number) => (d > 0 ? "+" : "−") + euro(Math.abs(d));

function Money({ value, per, className = "" }: { value: number; per?: "mois" | "an"; className?: string }) {
  return (
    <span className={`whitespace-nowrap [font-variant-numeric:tabular-nums] ${className}`} style={{ wordSpacing: "0.04em" }}>
      {euro(value)}
      {per && <span className="ml-1 align-baseline text-[0.6em] font-normal text-slate-soft" style={{ wordSpacing: "normal" }}>/ {per}</span>}
    </span>
  );
}
function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`rounded-[9px] px-3 py-1.5 text-[13px] font-semibold transition ${value === o.v ? "bg-white text-ink shadow-soft" : "text-slate hover:text-ink"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Liste compacte -> /salaires?q=nom */
function ProfileRow({ p }: { p: Profile }) {
  return (
    <Link href={`/salaires?q=${encodeURIComponent(p.name)}`}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/80 p-3.5 transition hover:-translate-y-[2px] hover:border-[#d7dceb] hover:shadow-card">
      <span className="min-w-0">
        <span className="block truncate text-[14.5px] font-semibold text-ink">{p.name}</span>
        <span className="block truncate text-[11.5px] text-slate-soft">{p.category}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="text-[13.5px] font-bold text-ink"><Money value={p.salary} per="an" /></span>
        <span className={`text-[11px] font-semibold [font-variant-numeric:tabular-nums] ${p.diff >= 0 ? "text-[#0EA371]" : "text-[#C0264A]"}`} style={{ wordSpacing: "0.04em" }}>
          {diffLabel(p.diff)}<span className="font-normal text-slate-soft"> / an</span>
        </span>
      </span>
    </Link>
  );
}

/** Carte profil (au-dessus / en dessous) — claire, premium, distinction douce par direction. */
function BetweenSide({ p, kind }: { p: Profile; kind: "below" | "above" }) {
  const tint = kind === "below" ? "#FFF1F3" : "#ECFBF4";
  const color = kind === "below" ? "#C0264A" : "#0A8F60";
  return (
    <Link href={`/salaires?q=${encodeURIComponent(p.name)}`}
      className="group relative block h-full overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_10px_30px_-18px_rgba(5,9,24,.3)] transition hover:-translate-y-[3px] hover:border-[#d7dceb] hover:shadow-[0_28px_64px_-32px_rgba(5,9,24,.55)]">
      <span aria-hidden className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(90% 70% at 50% 0%, ${kind === "below" ? "rgba(192,38,74,.07)" : "rgba(10,143,96,.09)"}, transparent 72%)` }} />
      <span className="relative flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full" style={{ background: tint, color }}>
          {kind === "below" ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
        </span>
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-slate">{kind === "below" ? "Juste en dessous" : "Juste au-dessus"}</span>
      </span>
      <span className="relative mt-2.5 block truncate text-[18px] font-extrabold text-ink transition-colors group-hover:text-brand-dark">{p.name}</span>
      <span className="relative mt-0.5 block truncate text-[12px] text-slate-soft">{p.category}</span>
      <span className="relative mt-3 flex items-center justify-between gap-2">
        <span className="text-[15px] font-extrabold text-ink"><Money value={p.salary} per="an" /></span>
        <span className="rounded-full px-2.5 py-0.5 text-[12px] font-bold [font-variant-numeric:tabular-nums]" style={{ background: tint, color, wordSpacing: "0.04em" }}>{diffLabel(p.diff)}</span>
      </span>
    </Link>
  );
}

export function Comparateur() {
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<Period>("mensuel");
  const [basis, setBasis] = useState<Basis>("net");
  const [bonus, setBonus] = useState("");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [shownAnnual, setShownAnnual] = useState(0);

  // Référence (fiche /salaires via ?target=slug, ou métier choisi).
  const [reference, setReference] = useState<Profile | null>(null);
  const [proOpen, setProOpen] = useState(false);
  const [profession, setProfession] = useState("");
  const [proLoading, setProLoading] = useState(false);

  const amountValue = parseAmount(amount);
  const valid = Number.isFinite(amountValue) && amountValue > 0;

  const comparableAnnual = useMemo(() => {
    if (!valid) return 0;
    let annual = (period === "mensuel" ? amountValue * 12 : amountValue) + (parseFloat(bonus) || 0);
    if (basis === "net") annual = annual / 0.78;
    return Math.round(annual);
  }, [valid, amountValue, period, basis, bonus]);

  // Résolution d'une référence par slug (fiche consultée).
  const resolveTarget = useCallback(async (slug: string) => {
    try {
      const res = await fetch(`/api/salaire/comparateur?target=${encodeURIComponent(slug)}`);
      if (!res.ok) return;
      const d = (await res.json()) as CompareResponse;
      if (d.reference) setReference(d.reference);
    } catch { /* silencieux */ }
  }, []);

  // Au montage : lire ?target= dans l'URL.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("target");
    if (slug) resolveTarget(slug);
  }, [resolveTarget]);

  // Résolution d'une référence par métier (recherche dans le CSV).
  const resolveProfession = useCallback(async (q: string) => {
    const query = q.trim();
    if (query.length < 2) return;
    setProLoading(true);
    try {
      const res = await fetch(`/api/salaires/search?q=${encodeURIComponent(query)}&limit=1`);
      const d = (await res.json()) as SearchResponse;
      const best = d.best as SearchResultItem | undefined;
      if (best && best.salaryTotalEur != null) {
        setReference({
          name: best.displayName,
          slug: best.slug,
          salary: best.salaryTotalEur,
          diff: 0,
          category: broadCategory(best),
          isPerson: best.type === "personne_nom",
        });
        setProOpen(false);
        setProfession("");
      }
    } catch { /* silencieux */ } finally {
      setProLoading(false);
    }
  }, []);

  const run = useCallback(async (annual: number, slug?: string) => {
    if (!(annual > 0)) return;
    setStatus("loading");
    setShownAnnual(annual);
    try {
      const url = `/api/salaire/comparateur?annual=${annual}${slug ? `&target=${encodeURIComponent(slug)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("bad");
      setData((await res.json()) as CompareResponse);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, []);

  const onExample = (ex: (typeof EXAMPLES)[number]) => {
    setBasis("brut");
    setBonus("");
    setPeriod(ex.period);
    setAmount(ex.amount);
    const annual = ex.period === "mensuel" ? parseAmount(ex.amount) * 12 : parseAmount(ex.amount);
    run(Math.round(annual), reference?.slug);
  };

  const reset = () => { setAmount(""); setBonus(""); setData(null); setStatus("idle"); };

  const below = data?.between.below ?? null;
  const above = data?.between.above ?? null;
  const userPos = scalePos(shownAnnual || comparableAnnual || 0);

  const synthese = (() => {
    if (below && above) return <>Votre salaire se situe entre <b className="font-extrabold text-ink">{below.name}</b> et <b className="font-extrabold text-ink">{above.name}</b>.</>;
    if (below) return <>Vous êtes au-dessus de <b className="font-extrabold text-ink">{below.name}</b>.</>;
    if (above) return <>Vous êtes en dessous de <b className="font-extrabold text-ink">{above.name}</b>.</>;
    return <>Votre salaire est hors de l’échelle des profils connus.</>;
  })();
  const betweenFrac = below && above && above.salary > below.salary
    ? Math.min(0.86, Math.max(0.14, (shownAnnual - below.salary) / (above.salary - below.salary)))
    : 0.5;

  // Comparaison à la référence.
  const refDiff = reference ? reference.salary - shownAnnual : 0; // >0 : la référence gagne plus
  const refPct = reference && reference.salary > 0 ? Math.round(((shownAnnual - reference.salary) / reference.salary) * 100) : 0;
  const refNear = reference ? Math.abs(refDiff) <= reference.salary * 0.04 : false;

  return (
    <div className="mx-auto max-w-[1040px]">
      {/* ---------- Bandeau référence ---------- */}
      {reference && (
        <div className="cjv-drop mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-[#D9CFFA] bg-gradient-to-r from-[#F4EFFE] via-[#F8F5FF] to-white p-4 md:p-5">
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#6D28D9]"><Briefcase className="h-3.5 w-3.5" /> Vous comparez votre salaire avec</span>
            <span className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="text-[19px] font-extrabold text-ink">{reference.name}</span>
              <span className="text-[14px] font-bold text-slate"><Money value={reference.salary} per="an" /></span>
              <span className="text-[12px] text-slate-soft">· {reference.category}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[13px] font-semibold">
            <button type="button" onClick={() => setProOpen((v) => !v)} className="text-[#6D28D9] transition hover:underline">Changer de référence</button>
            <button type="button" onClick={() => setReference(null)} className="inline-flex items-center gap-1 text-slate transition hover:text-ink"><X className="h-3.5 w-3.5" /> Sans référence</button>
          </div>
        </div>
      )}

      {/* ---------- Carte formulaire ---------- */}
      <div className="cjv-toolwrap">
        <div aria-hidden className="cjv-toolhalo" />
        <form onSubmit={(e) => { e.preventDefault(); run(comparableAnnual, reference?.slug); }}
          className="cjv-toolcard rounded-[28px] border border-line bg-white/85 p-5 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-7">
          <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Votre salaire</span>
              <div className="flex items-center rounded-xl border border-line bg-white px-3 transition focus-within:border-[#c7b6f2] focus-within:shadow-[0_0_0_4px_rgba(124,58,237,.08)]">
                <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="ex. 2 800"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-soft" />
                <span className="shrink-0 pl-2 text-[13px] font-medium text-slate-soft">€</span>
              </div>
            </label>
            <div>
              <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Période</span>
              <Seg<Period> value={period} onChange={setPeriod} options={[{ v: "mensuel", label: "Mensuel" }, { v: "annuel", label: "Annuel" }]} />
            </div>
            <div>
              <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Type</span>
              <Seg<Basis> value={basis} onChange={setBasis} options={[{ v: "brut", label: "Brut" }, { v: "net", label: "Net" }]} />
            </div>
          </div>

          <div className="mt-4 grid items-end gap-4 sm:grid-cols-[minmax(0,260px)_auto]">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Bonus annuel <span className="font-normal text-slate-soft">(optionnel)</span></span>
              <div className="flex items-center rounded-xl border border-line bg-white px-3 transition focus-within:border-[#c7b6f2] focus-within:shadow-[0_0_0_4px_rgba(124,58,237,.08)]">
                <input value={bonus} onChange={(e) => setBonus(e.target.value)} inputMode="decimal" placeholder="0"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-soft" />
                <span className="shrink-0 pl-2 text-[13px] font-medium text-slate-soft">€</span>
              </div>
            </label>
            <button type="submit" disabled={!valid}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-[15px] font-semibold text-ink shadow-[0_14px_30px_-12px_rgba(0,195,137,.6)] transition hover:-translate-y-px hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
              Voir où je me situe
            </button>
          </div>

          {/* Comparer à un métier (discret) */}
          <div className="mt-4 border-t border-line/60 pt-4">
            <button type="button" onClick={() => setProOpen((v) => !v)} className="flex items-center gap-2 text-[13px] font-semibold text-slate transition hover:text-ink">
              <Briefcase className="h-4 w-4 text-[#6D28D9]" />
              Je veux me comparer à un métier
              <ChevronDown className={`h-4 w-4 transition-transform ${proOpen ? "rotate-180" : ""}`} />
            </button>
            {proOpen && (
              <div className="cjv-drop mt-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate">Métier de référence</span>
                    <input value={profession} onChange={(e) => setProfession(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); resolveProfession(profession); } }}
                      placeholder="ex. Data scientist"
                      className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[14px] font-medium text-ink outline-none transition focus:border-[#c7b6f2] focus:shadow-[0_0_0_4px_rgba(124,58,237,.08)] placeholder:font-normal placeholder:text-slate-soft" />
                  </div>
                  <button type="button" onClick={() => resolveProfession(profession)} disabled={proLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-ink-soft disabled:opacity-50">
                    {proLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Définir
                  </button>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {PRO_EXAMPLES.map((m) => (
                    <button key={m} type="button" onClick={() => resolveProfession(m)}
                      className="rounded-lg border border-line bg-white px-2.5 py-1 text-[12px] font-semibold text-slate transition hover:-translate-y-[1px] hover:text-ink hover:shadow-soft">{m}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-soft">Exemples rapides</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex.label} type="button" onClick={() => onExample(ex)}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] font-semibold text-ink transition hover:-translate-y-[1px] hover:border-[#d7dceb] hover:shadow-soft">
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* ---------- États ---------- */}
      {status === "idle" && (
        <p className="mx-auto mt-8 max-w-[460px] text-center text-[15px] text-slate">Entrez un salaire pour lancer la comparaison.</p>
      )}
      {status === "error" && (
        <p className="mx-auto mt-8 max-w-[460px] text-center text-[15px] text-slate">Une erreur est survenue. Réessayez dans un instant.</p>
      )}

      {status === "done" && data && (
        <div key={shownAnnual} className="cjv-drop mt-8 space-y-7">
          {/* ====== Comparaison à la référence (contexte principal) ====== */}
          {reference && (
            <section className="cjv-toolwrap">
              <div aria-hidden className="cjv-toolhalo" />
              <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-[#D9CFFA] bg-gradient-to-br from-[#F4EFFE] via-[#F8F5FF] to-white p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] md:p-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D9CFFA] bg-white/70 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#6D28D9]"><Briefcase className="h-3.5 w-3.5" /> Par rapport à {reference.name}</span>
                <p className="mt-4 max-w-[660px] text-balance text-[clamp(20px,3.2vw,30px)] font-extrabold leading-[1.22] tracking-[-0.01em] text-ink">
                  {refNear ? (
                    <>Votre salaire est très proche de {reference.name}.</>
                  ) : refDiff > 0 ? (
                    <>Vous êtes à <span className="text-[#C0264A]"><Money value={Math.abs(refDiff)} per="an" /></span> sous ce profil.</>
                  ) : (
                    <>Vous êtes au-dessus de ce profil de <span className="text-[#0A8F60]"><Money value={Math.abs(refDiff)} per="an" /></span>.</>
                  )}
                </p>
                {!refNear && refPct !== 0 && (
                  <p className="mt-1.5 text-[14px] font-semibold text-slate">Soit environ {Math.abs(refPct)} % {refPct < 0 ? "de moins" : "de plus"} que cette référence.</p>
                )}
                <Link href={`/salaires?q=${encodeURIComponent(reference.name)}`} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-semibold text-white transition hover:-translate-y-px hover:bg-ink-soft">
                  Voir la fiche de {reference.name} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          )}

          {/* ====== Vous êtes entre… ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-line bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-surface px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-slate">
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden /> Vous êtes entre…
              </span>
              {/* Phrase : différence visuelle douce (flèches directionnelles, pas de surlignage) */}
              <p className="mt-4 flex max-w-[680px] flex-wrap items-center gap-x-1.5 text-balance text-[clamp(20px,3.2vw,30px)] font-extrabold leading-[1.22] tracking-[-0.01em] text-ink">
                {below && above ? (
                  <>
                    <span>Votre salaire se situe entre</span>
                    <span className="inline-flex items-center gap-1"><TrendingDown className="h-[0.7em] w-[0.7em] text-[#C0264A]" />{below.name}</span>
                    <span>et</span>
                    <span className="inline-flex items-center gap-1"><TrendingUp className="h-[0.7em] w-[0.7em] text-[#0A8F60]" />{above.name}</span>
                    <span>.</span>
                  </>
                ) : (
                  synthese
                )}
              </p>

              {(below || above) && (
                <div className="relative mt-8">
                  {below && above && (
                    <div aria-hidden className="pointer-events-none absolute inset-x-[18%] top-[64px] hidden md:block">
                      <div className="h-[3px] w-full rounded-full bg-gradient-to-r from-[#FFD0DA] via-[#E6E9F2] to-[#BFEFDC]" />
                      <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#7C3AED] shadow" style={{ left: `${betweenFrac * 100}%` }} />
                    </div>
                  )}
                  <div className="relative grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
                    {below ? <div className="cjv-in-left"><BetweenSide p={below} kind="below" /></div> : <div className="flex items-center justify-center rounded-2xl border border-dashed border-line bg-white/50 p-4 text-center text-[13px] text-slate-soft">Rien juste en dessous.</div>}
                    <div className="relative flex items-center justify-center">
                      <div className="cjv-you relative flex min-w-[150px] flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-6 py-4 text-center text-white shadow-[0_18px_40px_-14px_rgba(124,58,237,.6)]"
                        style={{ background: "linear-gradient(135deg,#7C3AED 0%,#5B4BE6 45%,#2F6BFF 100%)" }}>
                        <span aria-hidden className="cjv-you-glow" />
                        <span aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-white/20 blur-xl" />
                        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/85">Vous</span>
                        <span className="text-[16px] font-extrabold"><Money value={shownAnnual} per="an" /></span>
                      </div>
                    </div>
                    {above ? <div className="cjv-in-right"><BetweenSide p={above} kind="above" /></div> : <div className="flex items-center justify-center rounded-2xl border border-dashed border-line bg-white/50 p-4 text-center text-[13px] text-slate-soft">Rien juste au-dessus.</div>}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ====== Votre salaire sur l'échelle (grande carte interactive) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[32px] border border-line bg-white/90 p-7 shadow-[0_40px_100px_-50px_rgba(5,9,24,.55)] backdrop-blur md:p-12">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><Compass className="h-5 w-5" aria-hidden /></span>
                <h3 className="font-display text-[clamp(21px,3vw,30px)] font-extrabold tracking-[-0.015em] text-ink">Votre salaire sur l’échelle</h3>
              </div>
              <p className="mt-2 text-[14px] text-slate">Échelle en équivalent brut annuel — survolez un repère pour le détail (brut / net), cliquez pour ouvrir une fiche.</p>

              <div className="relative mt-32 mb-32 w-full">
                {/* piste épaisse */}
                <div className="h-5 w-full rounded-full" style={{ background: "linear-gradient(90deg,#00C389,#2F6BFF 42%,#7C3AED 72%,#FF4D67)" }} />

                {SCALE.map((m, idx) => {
                  const left = scalePos(m.pos);
                  const Tag: any = m.q ? Link : "div";
                  const tagProps = m.q ? { href: `/salaires?q=${encodeURIComponent(m.q)}` } : {};
                  const lower = idx % 2 === 1;
                  const edge = left < 14 ? "l" : left > 86 ? "r" : "c";
                  const tipPos = edge === "l" ? "left-0" : edge === "r" ? "right-0" : "left-1/2 -translate-x-1/2";
                  const arrPos = edge === "l" ? "left-3" : edge === "r" ? "right-3" : "left-1/2 -translate-x-1/2";
                  return (
                    <Tag key={m.label} {...tagProps}
                      className="group absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 hover:z-[70]"
                      style={{ left: `${left}%` }}>
                      <span className={`block h-[18px] w-[18px] rounded-full border-2 border-white shadow-[0_2px_8px_rgba(15,23,42,.32)] transition group-hover:scale-[1.4] ${m.q ? "cursor-pointer bg-[#7C3AED]" : "bg-slate-soft"}`} />
                      <span className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[12.5px] font-semibold ${m.q ? "text-[#6D28D9]" : "text-slate"} ${lower ? "top-7" : "bottom-7"}`}>{m.label}</span>
                      <span className={`pointer-events-none absolute bottom-[40px] z-[80] whitespace-nowrap rounded-xl bg-ink px-3.5 py-2.5 text-[13px] font-bold text-white opacity-0 shadow-[0_16px_36px_-10px_rgba(0,0,0,.6)] transition duration-150 group-hover:opacity-100 ${tipPos}`}>
                        {m.label} — {m.tip}
                        <span aria-hidden className={`absolute top-full h-2.5 w-2.5 -translate-y-1.5 rotate-45 bg-ink ${arrPos}`} />
                      </span>
                    </Tag>
                  );
                })}

                {/* marqueur utilisateur */}
                <div className="cjv-pin absolute -top-16 z-40 flex -translate-x-1/2 flex-col items-center" style={{ left: `${userPos}%` }}>
                  <span className="whitespace-nowrap rounded-lg bg-brand px-3.5 py-1.5 text-[12.5px] font-extrabold text-ink shadow-[0_8px_22px_-6px_rgba(0,195,137,.9)]">Vous êtes ici</span>
                  <span className="cjv-pin-dot mt-1.5 h-[22px] w-[22px] rounded-full border-2 border-white bg-brand shadow-[0_2px_12px_rgba(0,195,137,.75)]" />
                </div>
              </div>

              <p className="text-[12px] text-slate-soft">Repères indicatifs (SMIC, médian, moyen, cadre, top 10 %, top 1 %) — sources publiques, positionnés en équivalent brut. Outil statistique France détaillé à venir.</p>
            </div>
          </section>

          {/* ====== Listes compactes ====== */}
          {(data.listBelow.length > 0 || data.listAbove.length > 0) && (
            <section className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-[16px] font-bold text-ink"><TrendingDown className="h-4 w-4 text-[#C0264A]" aria-hidden /> Juste en dessous</h3>
                <div className="space-y-2.5">
                  {data.listBelow.length ? data.listBelow.map((p) => <ProfileRow key={p.name} p={p} />) : <p className="text-[13.5px] text-slate-soft">Rien juste en dessous dans la base.</p>}
                </div>
              </div>
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-[16px] font-bold text-ink"><TrendingUp className="h-4 w-4 text-[#0EA371]" aria-hidden /> Juste au-dessus</h3>
                <div className="space-y-2.5">
                  {data.listAbove.length ? data.listAbove.map((p) => <ProfileRow key={p.name} p={p} />) : <p className="text-[13.5px] text-slate-soft">Rien juste au-dessus dans la base.</p>}
                </div>
              </div>
            </section>
          )}

          <div className="text-center">
            <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-3 text-[14px] font-semibold text-ink transition hover:-translate-y-px hover:shadow-soft">
              Tester un autre salaire <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
