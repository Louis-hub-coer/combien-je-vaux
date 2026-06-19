"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Users, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

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
  jumeau: Profile | null;
  near: Profile[];
  above: Profile[];
  below: Profile[];
}

const NBSP = "\u00A0";
const FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
function euro(n: number): string {
  return FMT.format(Math.round(n)).replace(/\u202F/g, NBSP) + NBSP + "€";
}

const EXAMPLES = [
  { label: "2 500 € / mois", amount: "2500", period: "mensuel" as Period },
  { label: "45 000 € / an", amount: "45000", period: "annuel" as Period },
  { label: "80 000 € / an", amount: "80000", period: "annuel" as Period },
  { label: "150 000 € / an", amount: "150000", period: "annuel" as Period },
  { label: "1 000 000 € / an", amount: "1000000", period: "annuel" as Period },
];

// Repères de l'échelle (revenus annuels bruts indicatifs).
const SCALE = [
  { label: "SMIC", value: 21621 },
  { label: "Médian", value: 28000 },
  { label: "Cadre", value: 56000 },
  { label: "Médecin", value: 95000 },
  { label: "Trader", value: 180000 },
  { label: "Hauts revenus", value: 500000 },
];
const SC_MIN = 18000;
const SC_MAX = 10_000_000;
const scalePos = (v: number) => {
  const p = (Math.log(Math.min(SC_MAX, Math.max(SC_MIN, v))) - Math.log(SC_MIN)) / (Math.log(SC_MAX) - Math.log(SC_MIN));
  return Math.min(100, Math.max(0, p * 100));
};

function parseAmount(s: string): number {
  const n = parseFloat((s || "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function Money({ value, per, className = "" }: { value: number; per?: "mois" | "an"; className?: string }) {
  return (
    <span className={`whitespace-nowrap [font-variant-numeric:tabular-nums] ${className}`} style={{ wordSpacing: "0.04em" }}>
      {euro(value)}
      {per && <span className="ml-1 align-baseline text-[0.62em] font-normal text-slate-soft" style={{ wordSpacing: "normal" }}>/ {per}</span>}
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
function diffLabel(diff: number): string {
  const sign = diff > 0 ? "+" : "−";
  return `${sign}${euro(Math.abs(diff))}`;
}

/** Carte profil cliquable -> fiche /salaires?q=nom */
function ProfileCard({ p, lead }: { p: Profile; lead?: string }) {
  return (
    <Link
      href={`/salaires?q=${encodeURIComponent(p.name)}`}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/80 p-4 transition hover:-translate-y-[2px] hover:border-[#d7dceb] hover:shadow-card"
    >
      <span className="min-w-0">
        {lead && <span className="block text-[12.5px] font-bold text-brand-dark [font-variant-numeric:tabular-nums]">{lead}</span>}
        <span className="block truncate text-[15px] font-semibold text-ink">{p.name}</span>
        <span className="block truncate text-[12px] text-slate-soft">{p.category}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-[14px] font-bold text-ink"><Money value={p.salary} per="an" /></span>
        <span className={`text-[11.5px] font-semibold [font-variant-numeric:tabular-nums] ${p.diff >= 0 ? "text-[#0EA371]" : "text-[#C0264A]"}`} style={{ wordSpacing: "0.04em" }}>
          {diffLabel(p.diff)}<span className="font-normal text-slate-soft"> / an</span>
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

  const reset = () => {
    setAmount("");
    setBonus("");
    setData(null);
    setStatus("idle");
  };

  const userPos = scalePos(shownAnnual || comparableAnnual || 0);

  return (
    <div className="mx-auto max-w-[960px]">
      {/* ---------- Carte formulaire ---------- */}
      <div className="cjv-toolwrap">
        <div aria-hidden className="cjv-toolhalo" />
        <form
          onSubmit={(e) => { e.preventDefault(); run(comparableAnnual); }}
          className="cjv-toolcard rounded-[28px] border border-line bg-white/85 p-5 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-7"
        >
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
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Voir qui gagne comme moi
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

      {/* ---------- Résultats ---------- */}
      {status === "idle" && (
        <p className="mx-auto mt-8 max-w-[460px] text-center text-[15px] text-slate">
          Entrez un salaire pour lancer la comparaison.
        </p>
      )}

      {status === "error" && (
        <p className="mx-auto mt-8 max-w-[460px] text-center text-[15px] text-slate">Une erreur est survenue. Réessayez dans un instant.</p>
      )}

      {status === "done" && data?.jumeau && (
        <div key={shownAnnual} className="cjv-drop mt-8 space-y-8">
          {/* Jumeau salarial */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="overflow-hidden rounded-[28px] border border-transparent bg-gradient-to-br from-[#E1F7EF] via-[#ECF8F2] to-white p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] ring-1 ring-[#bfeada]/60 md:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#bfeada] bg-white/70 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-dark">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> Votre jumeau salarial
              </span>
              <p className="mt-4 text-[15px] text-slate">Vous gagnez presque comme…</p>
              <h2 className="mt-1 text-[clamp(28px,5vw,44px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">{data.jumeau.name}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-[clamp(20px,4vw,28px)] font-extrabold text-ink"><Money value={data.jumeau.salary} per="an" /></span>
                <span className={`rounded-full px-3 py-1 text-[13px] font-bold [font-variant-numeric:tabular-nums] ${data.jumeau.diff >= 0 ? "bg-[#E1F7EF] text-[#0A8F60]" : "bg-[#FFE5EA] text-[#C0264A]"}`} style={{ wordSpacing: "0.04em" }}>
                  Écart : {diffLabel(data.jumeau.diff)}<span className="font-normal"> / an</span>
                </span>
              </div>
              <Link href={`/salaires?q=${encodeURIComponent(data.jumeau.name)}`}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-[14px] font-semibold text-white transition hover:-translate-y-px hover:bg-ink-soft">
                Voir la fiche salaire <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* Échelle des salaires */}
          <section className="rounded-3xl border border-line bg-white/85 p-5 backdrop-blur md:p-6">
            <h3 className="font-display text-[16px] font-bold text-ink">Votre salaire sur l’échelle</h3>
            <div className="relative mt-12 mb-7">
              <div className="h-2.5 w-full rounded-full" style={{ background: "linear-gradient(90deg,#00C389,#2F6BFF 45%,#7C3AED 75%,#FF4D67)" }} />
              {SCALE.map((m) => (
                <div key={m.label} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${scalePos(m.value)}%` }}>
                  <span className="block h-3 w-px -translate-x-1/2 bg-slate-soft/60" />
                  <span className="mt-1 block -translate-x-1/2 whitespace-nowrap text-[10.5px] font-medium text-slate-soft">{m.label}</span>
                </div>
              ))}
              {/* Marqueur utilisateur */}
              <div className="absolute -top-11 flex -translate-x-1/2 flex-col items-center" style={{ left: `${userPos}%` }}>
                <span className="whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-[11px] font-bold text-white shadow-soft">Vous êtes ici</span>
                <span className="mt-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-ink shadow-[0_2px_8px_rgba(15,23,42,.4)]" />
              </div>
            </div>
            <p className="text-[12px] text-slate-soft">Repère visuel indicatif — pour vous situer précisément dans la population française, un outil dédié arrive.</p>
          </section>

          {/* Ils gagnent comme vous */}
          {data.near.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-display text-[18px] font-bold text-ink"><Users className="h-5 w-5 text-brand-dark" aria-hidden /> Ils gagnent presque comme vous</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.near.map((p) => <ProfileCard key={p.name} p={p} />)}
              </div>
            </section>
          )}

          {/* Juste au-dessus / juste en dessous */}
          {(data.above.length > 0 || data.below.length > 0) && (
            <section className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-[16px] font-bold text-ink"><TrendingUp className="h-4 w-4 text-[#0EA371]" aria-hidden /> Juste au-dessus</h3>
                <div className="space-y-3">
                  {data.above.length ? data.above.map((p) => <ProfileCard key={p.name} p={p} lead={`${diffLabel(p.diff)} / an`} />) : <p className="text-[13.5px] text-slate-soft">Rien juste au-dessus dans la base.</p>}
                </div>
              </div>
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-[16px] font-bold text-ink"><TrendingDown className="h-4 w-4 text-[#C0264A]" aria-hidden /> Juste en dessous</h3>
                <div className="space-y-3">
                  {data.below.length ? data.below.map((p) => <ProfileCard key={p.name} p={p} lead={`${diffLabel(p.diff)} / an`} />) : <p className="text-[13.5px] text-slate-soft">Rien juste en dessous dans la base.</p>}
                </div>
              </div>
            </section>
          )}

          <div className="text-center">
            <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-3 text-[14px] font-semibold text-ink transition hover:-translate-y-px hover:shadow-soft">
              Tester un autre salaire
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
