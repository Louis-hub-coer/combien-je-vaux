"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, ArrowRight, TrendingUp, TrendingDown, Loader2, ArrowLeftRight } from "lucide-react";

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
  annual: number;
  between: { below: Profile | null; above: Profile | null };
  listBelow: Profile[];
  listAbove: Profile[];
}

const NBSP = "\u00A0";
const FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euro = (n: number) => FMT.format(Math.round(n)).replace(/\u202F/g, NBSP) + NBSP + "€";

const EXAMPLES = [
  { label: "2 500 € / mois", amount: "2500", period: "mensuel" as Period },
  { label: "45 000 € / an", amount: "45000", period: "annuel" as Period },
  { label: "80 000 € / an", amount: "80000", period: "annuel" as Period },
  { label: "150 000 € / an", amount: "150000", period: "annuel" as Period },
  { label: "1 000 000 € / an", amount: "1000000", period: "annuel" as Period },
];

// Repères de l'échelle (revenus annuels bruts indicatifs). q = lien /salaires si pertinent.
const SCALE: { label: string; value: number; q?: string }[] = [
  { label: "SMIC", value: 21621 },
  { label: "Salaire médian", value: 28000 },
  { label: "Salaire moyen", value: 39000 },
  { label: "Cadre", value: 56000 },
  { label: "Top 10 %", value: 72000 },
  { label: "Médecin", value: 98000, q: "Médecin" },
  { label: "Trader", value: 130000, q: "Trader" },
  { label: "Très hauts revenus", value: 500000 },
  { label: "Stars", value: 12_000_000, q: "Mbappé" },
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

/** Profil dans une liste compacte -> /salaires?q=nom */
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

/** Côté de la carte « Vous êtes entre… ». */
function BetweenSide({ p, kind, delay = 0 }: { p: Profile; kind: "below" | "above"; delay?: number }) {
  const color = kind === "below" ? "#C0264A" : "#0A8F60";
  return (
    <Link href={`/salaires?q=${encodeURIComponent(p.name)}`}
      className="cjv-rise group relative block overflow-hidden rounded-2xl border border-line bg-white/85 p-4 pt-5 transition hover:-translate-y-[3px] hover:border-[#d7dceb] hover:shadow-card"
      style={{ animationDelay: `${delay}ms` }}>
      {/* accent coloré en haut */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color }}>
        {kind === "below" ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
        {kind === "below" ? "Juste en dessous" : "Juste au-dessus"}
      </span>
      <span className="mt-1.5 block truncate text-[17px] font-bold text-ink transition-colors group-hover:text-brand-dark">{p.name}</span>
      <span className="mt-0.5 block truncate text-[12px] text-slate-soft">{p.category}</span>
      <span className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[15px] font-extrabold text-ink"><Money value={p.salary} per="an" /></span>
        <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold [font-variant-numeric:tabular-nums] ${p.diff >= 0 ? "bg-[#E1F7EF] text-[#0A8F60]" : "bg-[#FFE5EA] text-[#C0264A]"}`} style={{ wordSpacing: "0.04em" }}>
          {diffLabel(p.diff)}
        </span>
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

  const amountValue = parseAmount(amount);
  const valid = Number.isFinite(amountValue) && amountValue > 0;

  // Revenu annuel BRUT comparable (les salaires du CSV sont des totaux annuels).
  const comparableAnnual = useMemo(() => {
    if (!valid) return 0;
    let annual = (period === "mensuel" ? amountValue * 12 : amountValue) + (parseFloat(bonus) || 0);
    if (basis === "net") annual = annual / 0.78; // conversion net -> brut approximative
    return Math.round(annual);
  }, [valid, amountValue, period, basis, bonus]);

  const run = useCallback(async (annual: number) => {
    if (!(annual > 0)) return;
    setStatus("loading");
    setShownAnnual(annual);
    try {
      const res = await fetch(`/api/salaire/comparateur?annual=${annual}`);
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
    run(Math.round(annual));
  };

  const reset = () => { setAmount(""); setBonus(""); setData(null); setStatus("idle"); };

  const below = data?.between.below ?? null;
  const above = data?.between.above ?? null;
  const userPos = scalePos(shownAnnual || comparableAnnual || 0);

  const hlBelow = "rounded-md bg-[#FFE5EA] px-1.5 py-0.5 font-extrabold text-[#C0264A]";
  const hlAbove = "rounded-md bg-[#E1F7EF] px-1.5 py-0.5 font-extrabold text-[#0A8F60]";
  const synthese = (() => {
    if (below && above) return <>Votre salaire se situe entre <span className={hlBelow}>{below.name}</span> et <span className={hlAbove}>{above.name}</span>.</>;
    if (below) return <>Vous êtes au-dessus de <span className={hlBelow}>{below.name}</span>.</>;
    if (above) return <>Vous êtes en dessous de <span className={hlAbove}>{above.name}</span>.</>;
    return <>Votre salaire est hors de l’échelle des profils connus.</>;
  })();

  return (
    <div className="mx-auto max-w-[980px]">
      {/* ---------- Carte formulaire ---------- */}
      <div className="cjv-toolwrap">
        <div aria-hidden className="cjv-toolhalo" />
        <form onSubmit={(e) => { e.preventDefault(); run(comparableAnnual); }}
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
          {/* ====== Vous êtes entre… ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-line bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-surface px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-slate">
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden /> Vous êtes entre…
              </span>
              <p className="mt-4 max-w-[680px] text-balance text-[clamp(20px,3.2vw,30px)] font-extrabold leading-[1.25] tracking-[-0.01em] text-ink">{synthese}</p>

              {(below || above) && (
                <div className="mt-6 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
                  {below ? <BetweenSide p={below} kind="below" delay={0} /> : <div className="flex items-center justify-center rounded-2xl border border-dashed border-line bg-white/50 p-4 text-center text-[13px] text-slate-soft">Rien juste en dessous.</div>}
                  <div className="cjv-rise relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-5 py-3 text-center text-white shadow-[0_14px_30px_-12px_rgba(47,107,255,.55)]"
                    style={{ background: "linear-gradient(135deg,#0A8F60,#2F6BFF)", animationDelay: "80ms" }}>
                    <span aria-hidden className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-white/15 blur-xl" />
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/80">Vous</span>
                    <span className="text-[15px] font-extrabold"><Money value={shownAnnual} per="an" /></span>
                  </div>
                  {above ? <BetweenSide p={above} kind="above" delay={160} /> : <div className="flex items-center justify-center rounded-2xl border border-dashed border-line bg-white/50 p-4 text-center text-[13px] text-slate-soft">Rien juste au-dessus.</div>}
                </div>
              )}
            </div>
          </section>

          {/* ====== Votre salaire sur l'échelle (grande carte interactive) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[28px] border border-line bg-white/90 p-6 shadow-[0_34px_90px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-10">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface text-brand-dark"><Compass className="h-4 w-4" aria-hidden /></span>
                <h3 className="font-display text-[clamp(19px,2.8vw,26px)] font-extrabold tracking-[-0.01em] text-ink">Votre salaire sur l’échelle</h3>
              </div>
              <p className="mt-1.5 text-[13.5px] text-slate">Survolez un repère pour voir le salaire, cliquez pour ouvrir une fiche.</p>

              <div className="relative mx-auto mt-24 mb-24 max-w-[900px]">
                {/* piste */}
                <div className="h-3.5 w-full rounded-full" style={{ background: "linear-gradient(90deg,#00C389,#2F6BFF 42%,#7C3AED 72%,#FF4D67)" }} />

                {/* repères */}
                {SCALE.map((m, idx) => {
                  const left = scalePos(m.value);
                  const Tag: any = m.q ? Link : "div";
                  const tagProps = m.q ? { href: `/salaires?q=${encodeURIComponent(m.q)}` } : {};
                  const lower = idx % 2 === 1; // étiquette alternée dessus/dessous (anti-chevauchement)
                  return (
                    <Tag key={m.label} {...tagProps}
                      className="group absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 hover:z-50"
                      style={{ left: `${left}%` }}>
                      <span className={`block h-4 w-4 rounded-full border-2 border-white shadow-[0_2px_6px_rgba(15,23,42,.3)] transition group-hover:scale-[1.35] ${m.q ? "cursor-pointer bg-[#7C3AED]" : "bg-slate-soft"}`} />
                      {/* étiquette persistante */}
                      <span className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11.5px] font-semibold ${m.q ? "text-[#6D28D9]" : "text-slate"} ${lower ? "top-6" : "bottom-6"}`}>{m.label}</span>
                      {/* tooltip — toujours au-dessus, au premier plan */}
                      <span className="pointer-events-none absolute bottom-[34px] left-1/2 z-[60] -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-[12.5px] font-bold text-white opacity-0 shadow-[0_12px_28px_-8px_rgba(0,0,0,.55)] transition duration-150 group-hover:opacity-100">
                        {m.label} — environ {euro(m.value)} / an
                        <span aria-hidden className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-ink" />
                      </span>
                    </Tag>
                  );
                })}

                {/* marqueur utilisateur */}
                <div className="cjv-pin absolute -top-14 z-40 flex -translate-x-1/2 flex-col items-center" style={{ left: `${userPos}%` }}>
                  <span className="whitespace-nowrap rounded-lg bg-brand px-3 py-1.5 text-[12px] font-extrabold text-ink shadow-[0_8px_20px_-6px_rgba(0,195,137,.85)]">Vous êtes ici</span>
                  <span className="cjv-pin-dot mt-1.5 h-5 w-5 rounded-full border-2 border-white bg-brand shadow-[0_2px_10px_rgba(0,195,137,.7)]" />
                </div>
              </div>

              <p className="text-[12px] text-slate-soft">Repère visuel indicatif — pour vous situer précisément dans la population française, un outil dédié arrive.</p>
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
