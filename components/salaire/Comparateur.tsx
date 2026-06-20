"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Compass, ArrowRight, TrendingUp, TrendingDown, Loader2, ArrowLeftRight, Briefcase, X, Plus, Search } from "lucide-react";
import { broadCategory } from "@/lib/display";
import type { SearchResponse, SearchResultItem, GroupVariant } from "@/types/search";

type Period = "mensuel" | "annuel";
type Basis = "brut" | "net";
type Kind = "all" | "metier" | "person";

interface Profile { name: string; slug: string; salary: number; diff: number; category: string; isPerson: boolean; }
interface RefExtra { city?: string; experience?: string; specialization?: string; }
interface CompareResponse {
  annual: number | null;
  reference: (Profile & RefExtra) | null;
  between: { below: Profile | null; above: Profile | null };
  listBelow: Profile[];
  listAbove: Profile[];
}
interface MetierRef { name: string; slug: string; isPerson: boolean; category: string; variants: GroupVariant[]; baseSalary: number; }
interface Suggestion { name: string; slug: string; salary: number; category: string; isPerson?: boolean; }

const NBSP = "\u00A0";
const FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euro = (n: number) => FMT.format(Math.round(n)).replace(/\u202F/g, NBSP) + NBSP + "€";
const NET2GROSS = 1 / 0.78;

const ADD_SUGGESTIONS = ["Data scientist", "Cardiologue", "Avocat", "Mbappé", "Taylor Swift", "Pilote de ligne"];
const EXP_ORDER = ["0-2 ans", "2-5 ans", "3-5 ans", "5-8 ans", "5-10 ans", "8-12 ans", "10-15 ans", "10 ans et +", "12 ans et +", "15 ans et +", "20 ans et +"];
const expRank = (e: string) => { const i = EXP_ORDER.indexOf(e); return i < 0 ? 999 : i; };

const SC_MIN = 18000;
const SC_MAX = 16_000_000;
const scalePos = (v: number) => {
  const p = (Math.log(Math.min(SC_MAX, Math.max(SC_MIN, v))) - Math.log(SC_MIN)) / (Math.log(SC_MAX) - Math.log(SC_MIN));
  return Math.min(100, Math.max(0, p * 100));
};
const parseAmount = (s: string) => { const n = parseFloat((s || "").replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n : NaN; };
const diffLabel = (d: number) => (d > 0 ? "+" : "−") + euro(Math.abs(d));
const uniq = (a: string[]) => Array.from(new Set(a.filter(Boolean)));

function Money({ value, per, className = "" }: { value: number; per?: "mois" | "an"; className?: string }) {
  return (
    <span className={`whitespace-nowrap [font-variant-numeric:tabular-nums] ${className}`} style={{ wordSpacing: "0.04em" }}>
      {euro(value)}
      {per && <span className="ml-1 align-baseline text-[0.6em] font-normal opacity-70" style={{ wordSpacing: "normal" }}>/ {per}</span>}
    </span>
  );
}
function Seg<T extends string>({ value, onChange, options, size = "md" }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[]; size?: "md" | "sm" }) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]";
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`rounded-[9px] font-semibold transition ${pad} ${value === o.v ? "bg-white text-ink shadow-soft" : "text-slate hover:text-ink"}`}>
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

/** Carte profil (au-dessus = vert/bleu, en dessous = corail/rouge) — opaque, lisible, premium. */
function BetweenSide({ p, kind }: { p: Profile; kind: "below" | "above" }) {
  const grad = kind === "below"
    ? "linear-gradient(135deg,#FB7185 0%,#E11D48 100%)"
    : "linear-gradient(135deg,#10B981 0%,#2563EB 100%)";
  const shadow = kind === "below" ? "0 18px 44px -18px rgba(225,29,72,.6)" : "0 18px 44px -18px rgba(16,185,129,.55)";
  return (
    <Link href={`/salaires?q=${encodeURIComponent(p.name)}`}
      className="group relative block h-full overflow-hidden rounded-2xl p-5 text-white transition hover:-translate-y-[3px]"
      style={{ background: grad, boxShadow: shadow }}>
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15 blur-2xl transition-opacity duration-300 group-hover:opacity-80" />
      <span className="relative flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
          {kind === "below" ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
        </span>
        <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-white/90">{kind === "below" ? "Juste en dessous" : "Juste au-dessus"}</span>
      </span>
      <span className="relative mt-2.5 block truncate text-[18px] font-extrabold">{p.name}</span>
      <span className="relative mt-0.5 block truncate text-[12px] text-white/75">{p.category}</span>
      <span className="relative mt-3 flex items-center justify-between gap-2">
        <span className="text-[15px] font-extrabold"><Money value={p.salary} per="an" /></span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[12px] font-bold [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.04em" }}>{diffLabel(p.diff)}</span>
      </span>
    </Link>
  );
}

export function Comparateur() {
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<Period>("mensuel");
  const [basis, setBasis] = useState<Basis>("net");
  const [bonus, setBonus] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [shownAnnual, setShownAnnual] = useState(0);

  // Référence métier + filtres (variantes réelles du CSV)
  const [metierRef, setMetierRef] = useState<MetierRef | null>(null);
  const [spec, setSpec] = useState("");
  const [city, setCity] = useState("");
  const [exp, setExp] = useState("");
  const [profession, setProfession] = useState("");
  const [sugg, setSugg] = useState<Suggestion[]>([]);
  const [hi, setHi] = useState(-1);
  const pendingPreselect = useRef<RefExtra | null>(null);

  // Métiers ajoutés à l'échelle
  const [extra, setExtra] = useState<{ name: string; salary: number; isPerson: boolean }[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addSugg, setAddSugg] = useState<Suggestion[]>([]);
  const [addHi, setAddHi] = useState(-1);

  const amountValue = parseAmount(amount);
  const valid = Number.isFinite(amountValue) && amountValue > 0;

  const comparableAnnual = useMemo(() => {
    if (!valid) return 0;
    let annual = (period === "mensuel" ? amountValue * 12 : amountValue) + (parseFloat(bonus) || 0);
    if (basis === "net") annual = annual / 0.78;
    return Math.round(annual);
  }, [valid, amountValue, period, basis, bonus]);

  // ---- Récupère un métier (avec variantes) par nom ----
  const fetchBest = useCallback(async (name: string): Promise<SearchResultItem | null> => {
    try {
      const res = await fetch(`/api/salaires/search?q=${encodeURIComponent(name)}&limit=1`);
      const d = (await res.json()) as SearchResponse;
      return d.best ?? null;
    } catch { return null; }
  }, []);

  const selectMetier = useCallback(async (name: string) => {
    const best = await fetchBest(name);
    if (!best) return;
    const variants = (best.groupVariants ?? []).filter((v) => v.salaryTotalEur != null);
    const ref: MetierRef = { name: best.displayName, slug: best.slug, isPerson: best.type === "personne_nom", category: broadCategory(best), variants, baseSalary: best.salaryTotalEur ?? 0 };
    setMetierRef(ref);
    // On NE referme PAS le module : si des filtres existent, l'utilisateur doit pouvoir les choisir avant validation.
    setProfession("");
    setSugg([]);
    setHi(-1);
    // Sélections par défaut : variante par défaut, seulement si >1 option dans la dimension
    const def = variants.find((v) => v.isDefault) ?? variants[0];
    const specs = uniq(variants.map((v) => v.specialization));
    const cities = uniq(variants.map((v) => v.city || v.country));
    const exps = uniq(variants.map((v) => v.experience));
    const pre = pendingPreselect.current;
    setSpec(specs.length > 1 ? (pre?.specialization && specs.includes(pre.specialization) ? pre.specialization : def?.specialization || "") : "");
    setCity(cities.length > 1 ? (pre?.city && cities.includes(pre.city) ? pre.city : def?.city || def?.country || "") : "");
    setExp(exps.length > 1 ? (pre?.experience && exps.includes(pre.experience) ? pre.experience : def?.experience || "") : "");
    pendingPreselect.current = null;
  }, [fetchBest]);

  // ---- Arrivée depuis /salaires : ?target=slug ----
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("target");
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/salaire/comparateur?target=${encodeURIComponent(slug)}`);
        const d = (await res.json()) as CompareResponse;
        if (d.reference) {
          pendingPreselect.current = { city: d.reference.city, experience: d.reference.experience, specialization: d.reference.specialization };
          await selectMetier(d.reference.name);
        }
      } catch { /* silencieux */ }
    })();
  }, [selectMetier]);

  // ---- Autocomplétion métiers (débouncée, endpoint dédié) ----
  useEffect(() => {
    const q = profession.trim();
    if (q.length < 2) { setSugg([]); setHi(-1); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/salaire/comparateur/suggest?q=${encodeURIComponent(q)}`);
        const d = (await res.json()) as { items: Suggestion[] };
        setSugg(d.items ?? []);
        setHi(d.items?.length ? 0 : -1);
      } catch { setSugg([]); }
    }, 160);
    return () => clearTimeout(t);
  }, [profession]);

  // ---- Variantes & référence calculée ----
  const variants = metierRef?.variants ?? [];
  const specs = useMemo(() => uniq(variants.map((v) => v.specialization)), [variants]);
  const cities = useMemo(() => uniq(variants.map((v) => v.city || v.country)), [variants]);
  const exps = useMemo(() => uniq(variants.map((v) => v.experience)).sort((a, b) => expRank(a) - expRank(b)), [variants]);

  const refCalc = useMemo(() => {
    if (!metierRef) return null;
    // Personnalités (ou métiers sans variantes) : un seul salaire de référence.
    if (!variants.length) {
      if (!(metierRef.baseSalary > 0)) return null;
      return { min: metierRef.baseSalary, max: metierRef.baseSalary, central: metierRef.baseSalary, count: 1 };
    }
    const m = variants.filter((v) => v.salaryTotalEur != null
      && (!spec || v.specialization === spec)
      && (!city || (v.city || v.country) === city)
      && (!exp || v.experience === exp));
    const pool = m.length ? m : variants;
    if (!pool.length) return null;
    const sals = pool.map((v) => v.salaryTotalEur as number).sort((a, b) => a - b);
    const min = sals[0], max = sals[sals.length - 1];
    const central = Math.round(sals.reduce((a, b) => a + b, 0) / sals.length);
    return { min, max, central, count: pool.length };
  }, [metierRef, variants, spec, city, exp]);

  const cityDisp = city || (cities.length === 1 ? cities[0] : "");
  const expDisp = exp || (exps.length === 1 ? exps[0] : "");
  const specDisp = spec || (specs.length === 1 ? specs[0] : "");
  const refContext = [specDisp, cityDisp, expDisp].filter(Boolean).join(" · ");
  // Phrases simples et naturelles (jamais le mot "niveau", jamais "référence").
  const cityClean = cityDisp && !/^france$/i.test(cityDisp) ? cityDisp : "";
  const cityPart = cityClean ? ` à ${cityClean}` : "";
  // Élision pour les noms propres : "de Mbappé" / "d'Ethan Mbappé".
  const elide = (n: string) => (/^[aeiouyàâäéèêëîïôöûüh]/i.test(n.trim()) ? `d'${n.trim()}` : `de ${n.trim()}`);
  const expPart = !metierRef?.isPerson && expDisp ? ` avec ${expDisp} d'expérience` : "";
  // Cible de comparaison : "de [nom]" pour une personne, "d'un [métier]{ à ville}{ avec exp}" pour un métier.
  const estTarget = metierRef
    ? (metierRef.isPerson ? elide(metierRef.name) : `d'un ${metierRef.name}${cityPart}${expPart}`)
    : "pour ce profil";

  // ---- Lancer la comparaison ----
  const resultsRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(false);
  const run = useCallback(async (annual: number, k: Kind) => {
    if (!(annual > 0)) return;
    shouldScroll.current = true;
    setStatus("loading");
    setShownAnnual(annual);
    try {
      const res = await fetch(`/api/salaire/comparateur?annual=${annual}&kind=${k}`);
      if (!res.ok) throw new Error("bad");
      setData((await res.json()) as CompareResponse);
      setStatus("done");
    } catch { setStatus("error"); }
  }, []);

  // Descente douce vers le résultat après une validation (pas lors d'un simple changement de filtre).
  useEffect(() => {
    if (status === "done" && shouldScroll.current) {
      shouldScroll.current = false;
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [status, shownAnnual]);

  // Recalcule UNIQUEMENT le bloc "entre" + listes, sans toucher au statut (pas de saut de page).
  const [kindLoading, setKindLoading] = useState(false);
  const refetchBetween = useCallback(async (k: Kind) => {
    if (!(shownAnnual > 0)) return;
    setKindLoading(true);
    try {
      const res = await fetch(`/api/salaire/comparateur?annual=${shownAnnual}&kind=${k}`);
      if (res.ok) setData((await res.json()) as CompareResponse);
    } catch { /* on garde l'affichage courant */ } finally {
      setKindLoading(false);
    }
  }, [shownAnnual]);

  // Quand le filtre Métiers/Perso change (résultat déjà affiché) : recalcul ciblé, sans recharger.
  useEffect(() => {
    if (status === "done" && shownAnnual > 0) refetchBetween(kind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const reset = () => { setAmount(""); setBonus(""); setData(null); setStatus("idle"); };

  // Autocomplétion de l'ajout de métier à l'échelle (même endpoint)
  useEffect(() => {
    const q = addQuery.trim();
    if (q.length < 2) { setAddSugg([]); setAddHi(-1); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/salaire/comparateur/suggest?q=${encodeURIComponent(q)}`);
        const d = (await res.json()) as { items: Suggestion[] };
        const items = (d.items ?? []).filter((it) => !extra.some((e) => e.name === it.name));
        setAddSugg(items);
        setAddHi(items.length ? 0 : -1);
      } catch { setAddSugg([]); }
    }, 160);
    return () => clearTimeout(t);
  }, [addQuery, extra]);

  const addMetier = async (name: string) => {
    if (extra.length >= 3 || extra.some((e) => e.name === name)) return;
    const best = await fetchBest(name);
    if (best && best.salaryTotalEur != null) setExtra((p) => [...p, { name: best.displayName, salary: best.salaryTotalEur as number, isPerson: best.type === "personne_nom" }]);
    setAddQuery("");
    setAddSugg([]);
  };

  const below = data?.between.below ?? null;
  const above = data?.between.above ?? null;
  const userPos = scalePos(shownAnnual || comparableAnnual || 0);
  const betweenFrac = below && above && above.salary > below.salary
    ? Math.min(0.86, Math.max(0.14, (shownAnnual - below.salary) / (above.salary - below.salary))) : 0.5;

  // Comparaison à la référence métier
  const refCentral = refCalc?.central ?? 0;
  const refDiff = refCentral ? refCentral - shownAnnual : 0;
  const refPct = refCentral > 0 ? Math.round(((shownAnnual - refCentral) / refCentral) * 100) : 0;
  const refNear = refCentral ? Math.abs(refDiff) <= refCentral * 0.04 : false;
  const refRange = refCalc && refCalc.min !== refCalc.max;

  // ---- Repères de l'échelle (montants uniformisés : toujours € / an, brut ou net précisé) ----
  const SCALE_FIXED: { label: string; pos: number; amount: number; basis: "brut" | "net" | ""; q?: string }[] = [
    { label: "SMIC", pos: 22404, amount: 22404, basis: "brut" },
    { label: "Salaire médian", pos: Math.round(26280 * NET2GROSS), amount: 26280, basis: "net" },
    { label: "Médecin", pos: 98000, amount: 98000, basis: "brut", q: "Médecin" },
    { label: "Trader", pos: 130000, amount: 130000, basis: "brut", q: "Trader" },
    { label: "Stars", pos: 12_000_000, amount: 12_000_000, basis: "brut", q: "Mbappé" },
  ];
  // Rendu uniforme d'un montant d'échelle.
  const fmtScale = (amount: number, basis: "brut" | "net" | "", approx = true) => `${approx ? "≈ " : ""}${euro(amount)}${basis ? ` ${basis}` : ""} / an`;

  return (
    <div className="mx-auto max-w-[1040px]">
      {/* ---------- Carte formulaire ---------- */}
      <div className="cjv-toolwrap relative z-30">
        <div aria-hidden className="cjv-toolhalo" />
        <form onSubmit={(e) => { e.preventDefault(); run(comparableAnnual, kind); }}
          className="cjv-toolcard rounded-[28px] border border-line bg-white/85 p-5 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-7">
          {/* Étape 1 — Votre salaire */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">1</span>
            <h3 className="font-display text-[16px] font-extrabold tracking-[-0.01em] text-ink">Votre salaire</h3>
          </div>
          <div className="mt-3 grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Montant</span>
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
          <label className="mt-3 block max-w-[240px]">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Bonus annuel <span className="font-normal text-slate-soft">(opt.)</span></span>
            <div className="flex items-center rounded-xl border border-line bg-white px-3 transition focus-within:border-[#c7b6f2] focus-within:shadow-[0_0_0_4px_rgba(124,58,237,.08)]">
              <input value={bonus} onChange={(e) => setBonus(e.target.value)} inputMode="decimal" placeholder="0"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-soft" />
              <span className="shrink-0 pl-2 text-[13px] font-medium text-slate-soft">€</span>
            </div>
          </label>

          {/* Étape 2 — Comparer avec (un métier ou une personnalité) */}
          <div className="mt-6 flex items-center gap-2.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">2</span>
            <h3 className="font-display text-[16px] font-extrabold tracking-[-0.01em] text-ink">Comparer avec <span className="text-[13px] font-semibold text-slate-soft">— optionnel</span></h3>
          </div>
          <div className="mt-3 rounded-2xl border border-[#E3DAFB] bg-gradient-to-br from-[#F7F4FE] to-white px-4 py-4 md:px-5">
            <p className="mb-3 text-[12.5px] text-slate">Choisissez un <b className="font-semibold text-ink">métier</b> ou une <b className="font-semibold text-ink">personnalité</b>, puis affinez si des filtres existent.</p>
            <div className="relative z-50 max-w-[460px]">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6D28D9]"><Search className="h-[18px] w-[18px]" /></span>
              <input value={profession}
                onChange={(e) => setProfession(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, sugg.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
                  else if (e.key === "Enter") { e.preventDefault(); if (sugg[hi]) selectMetier(sugg[hi].name); }
                  else if (e.key === "Escape") { setSugg([]); }
                }}
                placeholder="Rechercher un métier ou une personnalité…"
                className="w-full rounded-xl border border-[#D9CFFA] bg-white py-3 pl-11 pr-3 text-[14.5px] font-medium text-ink shadow-sm outline-none transition focus:border-[#b79df0] focus:shadow-[0_0_0_4px_rgba(124,58,237,.1)] placeholder:font-normal placeholder:text-slate-soft" />
              {sugg.length > 0 && (
                <ul className="absolute left-0 right-0 z-[60] mt-2 max-h-[296px] overflow-auto rounded-xl border border-line bg-white py-1 shadow-[0_24px_60px_-24px_rgba(5,9,24,.55)]">
                  {sugg.map((s, i) => (
                    <li key={s.slug + i}>
                      <button type="button" onMouseEnter={() => setHi(i)} onClick={() => selectMetier(s.name)}
                        className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition ${i === hi ? "bg-[#F4EFFE]" : "bg-white hover:bg-surface"}`}>
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${s.isPerson ? "bg-[#FFE5EA] text-[#E11D48]" : "bg-[#E1F7EF] text-[#00A06E]"}`}>{s.isPerson ? "★" : "•"}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-[14px] font-semibold text-ink">{s.name}</span>
                            <span className="block truncate text-[11.5px] text-slate-soft">{s.isPerson ? "Personnalité" : s.category}</span>
                          </span>
                        </span>
                        <span className="shrink-0 text-[12.5px] font-bold text-slate"><Money value={s.salary} per="an" /></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Filtres (uniquement si plusieurs variantes réelles) */}
            {metierRef && !metierRef.isPerson && (specs.length > 1 || cities.length > 1 || exps.length > 1) && (
              <div className="mt-4 flex flex-wrap items-end gap-2.5">
                {specs.length > 1 && (
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-soft">Spécialisation</span>
                    <select value={spec} onChange={(e) => setSpec(e.target.value)} className="rounded-xl border border-[#D9CFFA] bg-white px-3 py-2 text-[13px] font-semibold text-ink outline-none transition focus:border-[#b79df0]">
                      {specs.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                )}
                {cities.length > 1 && (
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-soft">Ville</span>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl border border-[#D9CFFA] bg-white px-3 py-2 text-[13px] font-semibold text-ink outline-none transition focus:border-[#b79df0]">
                      {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                )}
                {exps.length > 1 && (
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-soft">Expérience</span>
                    <select value={exp} onChange={(e) => setExp(e.target.value)} className="rounded-xl border border-[#D9CFFA] bg-white px-3 py-2 text-[13px] font-semibold text-ink outline-none transition focus:border-[#b79df0]">
                      {exps.map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </label>
                )}
              </div>
            )}

            {/* Profil sélectionné (zone unique de contexte) */}
            {metierRef && refCalc ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-[#D9CFFA] bg-white px-3.5 py-3">
                <div className="min-w-0">
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#6D28D9]">Profil sélectionné</span>
                  <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[15px] font-extrabold text-ink">{metierRef.name}</span>
                    {!metierRef.isPerson && refContext && <span className="text-[12px] font-semibold text-[#6D28D9]">{refContext}</span>}
                    <span className="text-[12.5px] font-bold text-slate">· {refRange ? <>{euro(refCalc.min)} – {euro(refCalc.max)} €</> : <Money value={refCalc.central} per="an" />}</span>
                  </span>
                </div>
                <button type="button" onClick={() => { setMetierRef(null); setProfession(""); setSugg([]); }} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-slate transition hover:text-ink"><X className="h-3.5 w-3.5" /> Retirer</button>
              </div>
            ) : (
              <p className="mt-2 text-[11.5px] text-slate-soft">Métiers et personnalités — suggestions immédiates, cliquables, sans appuyer sur Entrée.</p>
            )}
          </div>

          {/* Étape 3 — Bouton principal */}
          <button type="submit" disabled={!valid}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 text-[15.5px] font-semibold text-ink shadow-[0_16px_34px_-12px_rgba(0,195,137,.65)] transition hover:-translate-y-px hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
            Comparer mon salaire
          </button>
        </form>
      </div>

      {/* ---------- États ---------- */}
      {status === "idle" && <p className="mx-auto mt-8 max-w-[460px] text-center text-[15px] text-slate">Entrez un salaire pour lancer la comparaison.</p>}
      {status === "error" && <p className="mx-auto mt-8 max-w-[460px] text-center text-[15px] text-slate">Une erreur est survenue. Réessayez dans un instant.</p>}

      {status === "done" && data && (
        <div ref={resultsRef} key={shownAnnual} className="cjv-drop mt-8 space-y-7 scroll-mt-20">
          {/* ====== Comparaison à la référence métier ====== */}
          {metierRef && refCalc && (
            <section className="cjv-toolwrap">
              <div aria-hidden className="cjv-toolhalo" />
              <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-[#D9CFFA] bg-gradient-to-br from-[#F4EFFE] via-[#F8F5FF] to-white p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] md:p-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D9CFFA] bg-white/70 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#6D28D9]"><Briefcase className="h-3.5 w-3.5" /> Vous comparez votre salaire avec {metierRef.name}</span>
                {!metierRef.isPerson && refContext && <p className="mt-3 text-[13.5px] font-semibold text-[#6D28D9]">{refContext}</p>}
                <p className="mt-1 text-[14px] text-slate">Salaire estimé : <b className="font-extrabold text-ink">{refRange ? <>{euro(refCalc.min)} – <Money value={refCalc.max} per="an" /></> : <Money value={refCalc.central} per="an" />}</b></p>
                <p className="mt-4 max-w-[680px] text-balance text-[clamp(20px,3.2vw,30px)] font-extrabold leading-[1.22] tracking-[-0.01em] text-ink">
                  {refNear ? (<>Votre salaire est très proche du salaire estimé {estTarget}.</>)
                    : refDiff > 0 ? (<>Il vous manque environ <span className="text-[#C0264A]"><Money value={Math.abs(refDiff)} per="an" /></span> pour atteindre le salaire estimé {estTarget}.</>)
                    : (<>Vous gagnez environ <span className="text-[#0A8F60]"><Money value={Math.abs(refDiff)} per="an" /></span> de plus que le salaire estimé {estTarget}.</>)}
                </p>
                {!refNear && (
                  <p className="mt-1.5 text-[14px] font-semibold text-slate">
                    {refDiff > 0 ? `Soit environ ${Math.abs(refPct)} % de moins.` : `Soit environ ${Math.abs(refPct)} % de plus.`}
                  </p>
                )}
                <Link href={`/salaires?q=${encodeURIComponent(metierRef.name)}`} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-semibold text-white transition hover:-translate-y-px hover:bg-ink-soft">Voir la fiche de {metierRef.name} <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </section>
          )}

          {/* ====== Vous êtes entre… (filtre Tout/Métiers/Personnalités intégré) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-line bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-surface px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-slate"><ArrowLeftRight className="h-3.5 w-3.5" aria-hidden /> Vous êtes entre…</span>
                <div className="flex items-center gap-2">
                  {kindLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-soft" aria-hidden />}
                  <span className="text-[12px] font-semibold text-slate">Comparer avec :</span>
                  <Seg<Kind> value={kind} onChange={setKind} size="sm" options={[{ v: "all", label: "Tout" }, { v: "metier", label: "Métiers" }, { v: "person", label: "Personnalités" }]} />
                </div>
              </div>
              <div key={kind} className="cjv-drop">
              <p className="mt-4 flex max-w-[680px] flex-wrap items-center gap-x-1.5 text-balance text-[clamp(20px,3.2vw,30px)] font-extrabold leading-[1.22] tracking-[-0.01em] text-ink">
                {below && above ? (
                  <>
                    <span>Votre salaire se situe entre</span>
                    <span className="inline-flex items-center gap-1"><TrendingDown className="h-[0.7em] w-[0.7em] text-[#E11D48]" />{below.name}</span>
                    <span>et</span>
                    <span className="inline-flex items-center gap-1"><TrendingUp className="h-[0.7em] w-[0.7em] text-[#10B981]" />{above.name}</span><span>.</span>
                  </>
                ) : below ? <>Vous êtes au-dessus de <b className="ml-1 font-extrabold text-ink">{below.name}</b>.</>
                  : above ? <>Vous êtes en dessous de <b className="ml-1 font-extrabold text-ink">{above.name}</b>.</>
                  : <>Aucun profil comparable pour ce filtre.</>}
              </p>

              {(below || above) && (
                <div className="relative mt-8">
                  {below && above && (
                    <div aria-hidden className="pointer-events-none absolute inset-x-[18%] top-[64px] hidden md:block">
                      <div className="h-[3px] w-full rounded-full bg-gradient-to-r from-[#FB7185] via-[#E6E9F2] to-[#10B981]" />
                      <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#7C3AED] shadow" style={{ left: `${betweenFrac * 100}%` }} />
                    </div>
                  )}
                  <div className="relative grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
                    {below ? <div className="cjv-in-left"><BetweenSide p={below} kind="below" /></div> : <div className="flex items-center justify-center rounded-2xl border border-dashed border-line bg-white/50 p-4 text-center text-[13px] text-slate-soft">Rien juste en dessous.</div>}
                    <div className="relative flex items-center justify-center">
                      <div className="cjv-you relative flex min-w-[150px] flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-6 py-4 text-center text-white shadow-[0_18px_40px_-14px_rgba(124,58,237,.6)]" style={{ background: "linear-gradient(135deg,#7C3AED 0%,#5B4BE6 45%,#2F6BFF 100%)" }}>
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
            </div>
          </section>

          {/* ====== Votre salaire sur l'échelle ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[32px] border border-line bg-white/90 p-6 shadow-[0_40px_100px_-50px_rgba(5,9,24,.55)] backdrop-blur md:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><Compass className="h-5 w-5" aria-hidden /></span>
                  <h3 className="font-display text-[clamp(20px,2.8vw,28px)] font-extrabold tracking-[-0.015em] text-ink">Votre salaire sur l’échelle</h3>
                </div>
                {/* Ajouter un profil (métier ou personnalité) */}
                <div className="relative">
                  <button type="button" onClick={() => setAddOpen((v) => !v)} disabled={extra.length >= 3}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate transition hover:text-ink disabled:opacity-50">
                    <Plus className="h-3.5 w-3.5" /> Ajouter un profil
                  </button>
                  {addOpen && extra.length < 3 && (
                    <div className="absolute right-0 z-40 mt-2 w-[272px] rounded-2xl border border-line bg-white p-3 shadow-[0_24px_60px_-24px_rgba(5,9,24,.5)]">
                      <p className="mb-2 text-[11.5px] text-slate">Ajoutez jusqu’à 3 métiers ou personnalités pour comparer.</p>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft"><Search className="h-4 w-4" /></span>
                        <input value={addQuery} autoFocus
                          onChange={(e) => setAddQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") { e.preventDefault(); setAddHi((h) => Math.min(h + 1, addSugg.length - 1)); }
                            else if (e.key === "ArrowUp") { e.preventDefault(); setAddHi((h) => Math.max(h - 1, 0)); }
                            else if (e.key === "Enter") { e.preventDefault(); if (addSugg[addHi]) addMetier(addSugg[addHi].name); }
                            else if (e.key === "Escape") { setAddOpen(false); }
                          }}
                          placeholder="Ajouter un métier ou une personnalité…"
                          className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-[13.5px] font-medium text-ink outline-none transition focus:border-[#c7b6f2] focus:shadow-[0_0_0_3px_rgba(124,58,237,.08)] placeholder:font-normal placeholder:text-slate-soft" />
                      </div>
                      {addSugg.length > 0 ? (
                        <ul className="mt-2 max-h-[224px] overflow-auto">
                          {addSugg.map((s, i) => (
                            <li key={s.slug + i}>
                              <button type="button" onMouseEnter={() => setAddHi(i)} onClick={() => addMetier(s.name)}
                                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${i === addHi ? "bg-[#F4EFFE]" : "bg-white hover:bg-surface"}`}>
                                <span className="flex min-w-0 items-center gap-1.5">
                                  <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${s.isPerson ? "bg-[#FFE5EA] text-[#E11D48]" : "bg-[#E1F7EF] text-[#00A06E]"}`}>{s.isPerson ? "★" : "•"}</span>
                                  <span className="block truncate text-[13px] font-semibold text-ink">{s.name}</span>
                                </span>
                                <span className="shrink-0 text-[11.5px] font-bold text-slate-soft">{euro(s.salary)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-2">
                          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-soft">Populaires</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ADD_SUGGESTIONS.filter((m) => !extra.some((e) => e.name === m)).map((m) => (
                              <button key={m} type="button" onClick={() => addMetier(m)} className="rounded-lg border border-line bg-white px-2.5 py-1 text-[12px] font-semibold text-slate transition hover:text-ink hover:shadow-soft">{m}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-2 text-[13.5px] text-slate">Montants exprimés en <b className="font-semibold text-ink">€ / an</b> (brut ou net précisé). Survolez un point pour le détail, cliquez pour la fiche.</p>

              {/* profils ajoutés */}
              {extra.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {extra.map((e) => (
                    <span key={e.name} className="inline-flex items-center gap-1.5 rounded-full bg-[#EEE7FD] px-2.5 py-1 text-[12px] font-semibold text-[#6D28D9]">
                      {e.name} · {euro(e.salary)}
                      <button type="button" onClick={() => setExtra((p) => p.filter((x) => x.name !== e.name))}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              {/* échelle : pleine largeur desktop (sans scroll souris), scroll horizontal mobile uniquement */}
              <div className="mt-24 overflow-x-auto pb-3 md:mt-28 md:overflow-x-visible">
                <div className="relative mx-auto mb-24 min-w-[560px] md:mb-28 md:min-w-0">
                  <div className="h-[22px] w-full rounded-full" style={{ background: "linear-gradient(90deg,#00C389,#2F6BFF 42%,#7C3AED 72%,#FF4D67)" }} />

                  {/* repères + métier/personne comparé + ajoutés, avec gestion des collisions */}
                  {(() => {
                    type Pt = { label: string; pos: number; lines: string[]; q?: string; kind: "fix" | "metier" | "extra" };
                    const base: Pt[] = SCALE_FIXED.map((s) => ({ label: s.label, pos: s.pos, lines: [fmtScale(s.amount, s.basis, true)], q: s.q, kind: "fix" as const }));
                    if (metierRef && refCalc) {
                      const b: "brut" | "" = metierRef.isPerson ? "" : "brut";
                      const amountText = refRange ? `${euro(refCalc.min)} – ${euro(refCalc.max)}${b ? ` ${b}` : ""} / an` : fmtScale(refCalc.central, b, false);
                      base.push({ label: metierRef.name, pos: refCalc.central, lines: [!metierRef.isPerson && refContext ? refContext : "", amountText].filter(Boolean), q: metierRef.name, kind: "metier" });
                    }
                    extra.forEach((e) => base.push({ label: e.name, pos: e.salary, lines: [fmtScale(e.salary, e.isPerson ? "" : "brut", false)], q: e.name, kind: "extra" }));

                    const items = base.sort((a, b) => a.pos - b.pos).map((m) => ({ ...m, left: scalePos(m.pos) }));
                    // Coloration gloutonne : deux points proches reçoivent des "lignes" différentes (alternance haut/bas + paliers).
                    const GAP = 12;
                    const levels: number[] = [];
                    items.forEach((it, i) => {
                      const used = new Set<number>();
                      for (let j = 0; j < i; j++) if (Math.abs(it.left - items[j].left) < GAP) used.add(levels[j]);
                      let lvl = 0; while (used.has(lvl)) lvl++; levels[i] = lvl;
                    });

                    return items.map((m, idx) => {
                      const level = levels[idx];
                      const side: "below" | "above" = level % 2 === 0 ? "below" : "above";
                      const tier = Math.floor(level / 2);
                      const off = 28 + tier * 20;
                      const labelHidden = tier >= 2; // au-delà de 2 paliers : libellé au survol uniquement
                      const left = m.left;
                      const Tag: any = m.q ? Link : "div";
                      const tagProps = m.q ? { href: `/salaires?q=${encodeURIComponent(m.q)}` } : {};
                      const edge = left < 13 ? "l" : left > 87 ? "r" : "c";
                      const tipPos = edge === "l" ? "left-0" : edge === "r" ? "right-0" : "left-1/2 -translate-x-1/2";
                      const arrPos = edge === "l" ? "left-4" : edge === "r" ? "right-4" : "left-1/2 -translate-x-1/2";
                      const dot = m.kind === "metier" ? "bg-[#7C3AED] ring-4 ring-[#7C3AED]/25" : m.kind === "extra" ? "bg-[#2F6BFF]" : m.q ? "bg-[#7C3AED]" : "bg-slate-soft";
                      const lblColor = m.kind === "metier" ? "text-[#6D28D9] font-bold" : m.kind === "extra" ? "text-[#2F6BFF] font-semibold" : m.q ? "text-[#6D28D9] font-semibold" : "text-slate font-semibold";
                      return (
                        <Tag key={`${m.label}-${idx}`} {...tagProps} className="group absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 hover:z-[70]" style={{ left: `${left}%` }}>
                          {!labelHidden && tier > 0 && <span aria-hidden className="absolute left-1/2 w-px -translate-x-1/2 bg-line" style={side === "below" ? { top: "10px", height: `${off - 12}px` } : { bottom: "10px", height: `${off - 12}px` }} />}
                          <span className={`block h-[18px] w-[18px] rounded-full border-2 border-white shadow-[0_2px_8px_rgba(15,23,42,.32)] transition group-hover:scale-[1.45] ${dot}`} />
                          {!labelHidden && (
                            <span className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] ${lblColor}`} style={side === "below" ? { top: `${off}px` } : { bottom: `${off}px` }}>{m.label}</span>
                          )}
                          <span className={`pointer-events-none absolute bottom-[46px] z-[90] w-max max-w-[230px] rounded-xl bg-ink px-3.5 py-2.5 text-left opacity-0 shadow-[0_16px_36px_-10px_rgba(0,0,0,.6)] transition duration-150 group-hover:opacity-100 ${tipPos}`}>
                            <span className="block text-[13px] font-extrabold text-white">{m.label}</span>
                            {m.lines.map((ln, k) => (
                              <span key={k} className={`block ${k === m.lines.length - 1 ? "mt-0.5 text-[12.5px] font-bold text-white" : "text-[11.5px] font-medium text-white/70"}`}>{ln}</span>
                            ))}
                            <span aria-hidden className={`absolute top-full h-2.5 w-2.5 -translate-y-1.5 rotate-45 bg-ink ${arrPos}`} />
                          </span>
                        </Tag>
                      );
                    });
                  })()}

                  {/* marqueur utilisateur */}
                  <div className="cjv-pin absolute -top-[66px] z-50 flex -translate-x-1/2 flex-col items-center" style={{ left: `${userPos}%` }}>
                    <span className="whitespace-nowrap rounded-lg bg-brand px-3.5 py-1.5 text-[12.5px] font-extrabold text-ink shadow-[0_8px_22px_-6px_rgba(0,195,137,.9)]">Vous · {euro(shownAnnual)}</span>
                    <span className="cjv-pin-dot mt-1.5 h-[22px] w-[22px] rounded-full border-[3px] border-white bg-brand shadow-[0_2px_12px_rgba(0,195,137,.8)]" />
                  </div>
                </div>
              </div>

              <p className="text-[12px] text-slate-soft">Repères : SMIC · Salaire médian · Profil comparé · Trader · Médecin · Stars (+ vos profils ajoutés).</p>
            </div>
          </section>

          {/* ====== Listes compactes ====== */}
          {(data.listBelow.length > 0 || data.listAbove.length > 0) && (
            <section className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-[16px] font-bold text-ink"><TrendingDown className="h-4 w-4 text-[#E11D48]" aria-hidden /> Juste en dessous</h3>
                <div className="space-y-2.5">{data.listBelow.length ? data.listBelow.map((p) => <ProfileRow key={p.name} p={p} />) : <p className="text-[13.5px] text-slate-soft">Rien juste en dessous.</p>}</div>
              </div>
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-[16px] font-bold text-ink"><TrendingUp className="h-4 w-4 text-[#10B981]" aria-hidden /> Juste au-dessus</h3>
                <div className="space-y-2.5">{data.listAbove.length ? data.listAbove.map((p) => <ProfileRow key={p.name} p={p} />) : <p className="text-[13.5px] text-slate-soft">Rien juste au-dessus.</p>}</div>
              </div>
            </section>
          )}

          <div className="text-center">
            <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-3 text-[14px] font-semibold text-ink transition hover:-translate-y-px hover:shadow-soft">Tester un autre salaire <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
