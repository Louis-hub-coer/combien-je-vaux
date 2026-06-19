"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, Sparkles, ChevronDown } from "lucide-react";
import {
  calculateFromGross,
  calculateFromNet,
  buildBrutNetChartData,
  formatSalaryAmount,
  type Status,
  type Period,
  type BrutNetResult,
} from "@/lib/salary/brutNet";

type Mode = "rapide" | "avance" | "precis";
type Direction = "brut" | "net";
type NetBasis = "before" | "after";
type Disp = "mois" | "an";

const MODES: { key: Mode; label: string; promise: string }[] = [
  { key: "rapide", label: "Rapide", promise: "Une estimation en 10 secondes." },
  { key: "avance", label: "Avancé", promise: "Ajoutez seulement ce qui change vraiment le résultat." },
  { key: "precis", label: "Précis", promise: "Une estimation plus complète, sans formulaire interminable." },
];

const EXAMPLES = [
  { label: "2 500 € brut / mois", amount: "2500", period: "mensuel" as Period },
  { label: "45 000 € brut / an", amount: "45000", period: "annuel" as Period },
  { label: "80 000 € brut / an", amount: "80000", period: "annuel" as Period },
  { label: "120 000 € brut / an", amount: "120000", period: "annuel" as Period },
];

function parseAmount(s: string): number {
  const n = parseFloat((s || "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}
function computeParts(couple: boolean, children: number): number {
  let p = couple ? 2 : 1;
  p += Math.min(children, 2) * 0.5 + Math.max(0, children - 2) * 1;
  return p;
}

/* — petits composants UI — */
function Seg<T extends string>({ value, onChange, options, size = "md" }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[]; size?: "md" | "sm" }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-[9px] font-semibold transition ${size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]"} ${value === o.v ? "bg-white text-ink shadow-soft" : "text-slate hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-slate-soft">{hint}</span>}
    </label>
  );
}
function NumberInput({ value, onChange, placeholder, suffix }: { value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string }) {
  return (
    <div className="flex items-center rounded-xl border border-line bg-white px-3 transition focus-within:border-[#c7b6f2] focus-within:shadow-[0_0_0_4px_rgba(124,58,237,.08)]">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-soft"
      />
      {suffix && <span className="shrink-0 pl-2 text-[13px] font-medium text-slate-soft">{suffix}</span>}
    </div>
  );
}
function Money({ value, per }: { value: number; per: Disp }) {
  return (
    <span className="whitespace-nowrap [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.04em" }}>
      {formatSalaryAmount(value)}
      <span className="ml-1 align-baseline text-[0.62em] font-normal text-slate-soft" style={{ wordSpacing: "normal" }}>/ {per}</span>
    </span>
  );
}

export function BrutNetCalculator() {
  const [mode, setMode] = useState<Mode>("rapide");
  const [direction, setDirection] = useState<Direction>("brut");
  const [netBasis, setNetBasis] = useState<NetBasis>("before");
  const [disp, setDisp] = useState<Disp>("mois");
  const [openInfo, setOpenInfo] = useState(false);

  // commun
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<Period>("mensuel");
  const [status, setStatus] = useState<Status>("cadre");

  // avancé
  const [bonus, setBonus] = useState("");
  const [thirteenth, setThirteenth] = useState(false);
  const [pas, setPas] = useState("");
  const [partPct, setPartPct] = useState("");

  // précis
  const [couple, setCouple] = useState(false);
  const [children, setChildren] = useState("0");
  const [taxChoice, setTaxChoice] = useState<"bareme" | "pas">("bareme");

  const amountValue = parseAmount(amount);
  const valid = Number.isFinite(amountValue) && amountValue > 0;
  const parts = useMemo(() => computeParts(couple, Math.max(0, parseInt(children || "0", 10) || 0)), [couple, children]);

  const result: BrutNetResult | null = useMemo(() => {
    if (!valid) return null;
    const pasRate = pas.trim() ? Math.min(1, Math.max(0, (parseFloat(pas.replace(",", ".")) || 0) / 100)) : null;

    const opts =
      mode === "rapide"
        ? { status, parts: 1, isCouple: false, taxMode: "bareme" as const }
        : mode === "avance"
          ? { status, parts: 1, isCouple: false, pasRate, taxMode: pasRate != null ? ("pas" as const) : ("bareme" as const) }
          : { status, parts, isCouple: couple, pasRate, taxMode: taxChoice === "pas" && pasRate != null ? ("pas" as const) : ("bareme" as const) };

    if (direction === "net") {
      return calculateFromNet(amountValue, netBasis, opts);
    }
    const pct = mode === "avance" && partPct.trim() ? Math.min(100, Math.max(1, parseFloat(partPct) || 100)) : 100;
    return calculateFromGross(
      {
        amount: amountValue,
        period,
        partTimePercent: pct,
        thirteenthMonth: mode === "avance" ? thirteenth : false,
        bonusAnnual: mode === "avance" ? parseFloat(bonus) || 0 : 0,
      },
      opts,
    );
  }, [valid, amountValue, period, status, mode, direction, netBasis, bonus, thirteenth, pas, partPct, parts, couple, taxChoice]);

  const bars = result ? buildBrutNetChartData(result) : [];
  const maxBar = bars.length ? Math.max(...bars.map((b) => b.value)) : 1;

  // valeur selon la période d'affichage
  const pick = (monthly: number, annual: number) => (disp === "mois" ? monthly : annual);
  const other: Disp = disp === "mois" ? "an" : "mois";

  return (
    <div className="mx-auto max-w-[940px]">
      {/* Modes + sens */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl border border-line bg-white p-1 shadow-soft">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`rounded-xl px-4 py-2 text-[14px] font-semibold transition ${mode === m.key ? "bg-brand text-ink shadow-[0_10px_22px_-12px_rgba(0,195,137,.7)]" : "text-slate hover:text-ink"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Seg<Direction>
          value={direction}
          onChange={setDirection}
          options={[
            { v: "brut", label: "Je pars du brut" },
            { v: "net", label: "Je pars du net" },
          ]}
        />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[13px] text-slate">
        <Sparkles className="h-3.5 w-3.5 text-brand-dark" aria-hidden />
        {MODES.find((m) => m.key === mode)?.promise}
      </p>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ---------- Formulaire ---------- */}
        <div className="rounded-3xl border border-line bg-white/85 p-5 backdrop-blur md:p-6">
          <div className="grid gap-4">
            <Field label={direction === "brut" ? "Montant" : netBasis === "before" ? "Net mensuel avant impôt" : "Net mensuel après impôt"}>
              <NumberInput value={amount} onChange={setAmount} placeholder="ex. 3 000" suffix="€" />
            </Field>

            {direction === "net" && (
              <Seg<NetBasis>
                value={netBasis}
                onChange={setNetBasis}
                options={[
                  { v: "before", label: "Avant impôt" },
                  { v: "after", label: "Après impôt" },
                ]}
              />
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {direction === "brut" && (
                <div>
                  <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Je saisis</span>
                  <Seg<Period>
                    value={period}
                    onChange={setPeriod}
                    options={[
                      { v: "mensuel", label: "Brut mensuel" },
                      { v: "annuel", label: "Brut annuel" },
                    ]}
                  />
                </div>
              )}
              <div>
                <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Statut</span>
                <Seg<Status>
                  value={status}
                  onChange={setStatus}
                  options={[
                    { v: "cadre", label: "Cadre" },
                    { v: "non-cadre", label: "Non-cadre" },
                  ]}
                />
              </div>
            </div>

            {/* Avancé : seulement l'essentiel */}
            {mode === "avance" && (
              <div className="grid gap-4 rounded-2xl border border-line bg-surface/60 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Bonus annuel"><NumberInput value={bonus} onChange={setBonus} placeholder="0" suffix="€" /></Field>
                  <Field label="Temps partiel" hint="Laissez vide si temps plein."><NumberInput value={partPct} onChange={setPartPct} placeholder="100" suffix="%" /></Field>
                  <Field label="Taux de prélèvement à la source" hint="Vide = estimation au barème."><NumberInput value={pas} onChange={setPas} placeholder="ex. 7,5" suffix="%" /></Field>
                  <label className="flex items-end gap-2.5 pb-2.5 text-[13.5px] font-medium text-ink">
                    <input type="checkbox" checked={thirteenth} onChange={(e) => setThirteenth(e.target.checked)} className="h-4 w-4 accent-[#00C389]" />
                    13ᵉ mois
                  </label>
                </div>
              </div>
            )}

            {/* Précis : seulement le fiscal essentiel */}
            {mode === "precis" && (
              <div className="grid gap-4 rounded-2xl border border-line bg-surface/60 p-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div>
                    <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Situation</span>
                    <Seg<"seul" | "couple">
                      value={couple ? "couple" : "seul"}
                      onChange={(v) => setCouple(v === "couple")}
                      options={[
                        { v: "seul", label: "Seul" },
                        { v: "couple", label: "Couple" },
                      ]}
                    />
                  </div>
                  <Field label="Enfants à charge"><div className="w-[110px]"><NumberInput value={children} onChange={setChildren} placeholder="0" /></div></Field>
                  <Field label="Parts fiscales" hint="Calculé.">
                    <div className="rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] font-semibold text-ink">{parts.toLocaleString("fr-FR")}</div>
                  </Field>
                </div>
                <div>
                  <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Impôt</span>
                  <Seg<"bareme" | "pas">
                    value={taxChoice}
                    onChange={setTaxChoice}
                    options={[
                      { v: "bareme", label: "Estimation au barème" },
                      { v: "pas", label: "J’ai un taux PAS" },
                    ]}
                  />
                  {taxChoice === "pas" && <div className="mt-3 max-w-[220px]"><NumberInput value={pas} onChange={setPas} placeholder="Taux PAS, ex. 7,5" suffix="%" /></div>}
                </div>
              </div>
            )}

            {/* Exemples */}
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-soft">Exemples rapides</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => { setDirection("brut"); setAmount(ex.amount); setPeriod(ex.period); }}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] font-semibold text-ink transition hover:-translate-y-[1px] hover:border-[#d7dceb] hover:shadow-soft"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Résultat ---------- */}
        <div>
          {/* Toggle d'affichage */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-soft">Résultat</span>
            <span className="flex items-center gap-2">
              <span className="text-[12px] text-slate-soft">Afficher</span>
              <Seg<Disp>
                value={disp}
                onChange={setDisp}
                size="sm"
                options={[
                  { v: "mois", label: "Mensuel" },
                  { v: "an", label: "Annuel" },
                ]}
              />
            </span>
          </div>

          {!valid && (
            <div className="rounded-3xl border border-dashed border-line bg-white/70 p-5 text-center backdrop-blur">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-tint text-brand-dark"><ArrowRightLeft className="h-5 w-5" /></span>
              <h2 className="mt-3 font-display text-[17px] font-bold text-ink">Entrez un montant valide pour lancer la simulation.</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 opacity-50">
                {["Net avant impôt", "Net après impôt", `Net après impôt`, "Coût employeur estimé"].map((l, i) => (
                  <div key={i} className="rounded-2xl border border-line bg-white/60 p-4 text-left">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-soft">{l}</span>
                    <span className="mt-1 block text-[20px] font-extrabold text-slate-soft">— / {disp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {valid && result && (
            <div key={`${result.grossAnnual}-${disp}`} className="cjv-drop space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <ResultTile tone="brand" label="Net avant impôt" value={pick(result.netBeforeTaxMonthly, result.netBeforeTaxAnnual)} per={disp} big />
                <ResultTile tone="ink" label="Net après impôt" value={pick(result.netAfterTaxMonthly, result.netAfterTaxAnnual)} per={disp} big />
                <ResultTile tone="soft" label="Net après impôt" value={disp === "mois" ? result.netAfterTaxAnnual : result.netAfterTaxMonthly} per={other} />
                <ResultTile tone="soft" label="Coût employeur estimé" value={pick(result.employerCostMonthly, result.employerCostAnnual)} per={disp} />
              </div>

              {/* Graphique */}
              <div className="rounded-3xl border border-line bg-white/85 p-5 backdrop-blur">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-soft">Du coût employeur au net (par an)</p>
                <div className="space-y-2.5">
                  {bars.map((b, i) => (
                    <div key={b.key}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-[12.5px]">
                        <span className="min-w-0 truncate font-medium text-slate">{b.label}</span>
                        <span className="shrink-0 whitespace-nowrap font-bold text-ink [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.04em" }}>{formatSalaryAmount(b.value)}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full origin-left rounded-full"
                          style={{ width: `${Math.max(3, (b.value / maxBar) * 100)}%`, background: b.color, animation: `cjvBar .6s ease-out ${i * 0.08}s both` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Décomposition + accordéon */}
      {valid && result && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-line bg-white/85 p-5 backdrop-blur transition hover:shadow-card md:p-6">
            <h3 className="font-display text-[16px] font-bold text-ink">Décomposition</h3>
            <div className="mt-3 space-y-1">
              <DRow label={disp === "mois" ? "Brut mensuel" : "Brut annuel"} value={pick(result.grossMonthly, result.grossAnnual)} per={disp} />
              <DRow label="Cotisations salariales" value={-pick(result.employeeContributions / 12, result.employeeContributions)} per={disp} badge={`${Math.round(result.employeeRate * 100)} %`} />
              <DRow label="Net avant impôt" value={pick(result.netBeforeTaxMonthly, result.netBeforeTaxAnnual)} per={disp} strong />
              <DRow label="Impôt estimé" value={-pick(result.incomeTaxAnnual / 12, result.incomeTaxAnnual)} per={disp} badge={`${(result.pasRateUsed * 100).toFixed(1)} %`} />
              <DRow label="Net après impôt" value={pick(result.netAfterTaxMonthly, result.netAfterTaxAnnual)} per={disp} strong />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line/70 pt-3 text-[12.5px] text-slate-soft">
              <span>Coût employeur estimé</span>
              <span className="shrink-0 whitespace-nowrap font-semibold text-slate [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.04em" }}>
                {formatSalaryAmount(pick(result.employerCostMonthly, result.employerCostAnnual))}<span className="ml-1 text-[0.85em] font-normal">/ {disp}</span>
              </span>
            </div>
          </div>

          {/* Accordéon pédagogique (fermé par défaut) */}
          <div className="self-start rounded-3xl border border-line bg-white/85 backdrop-blur">
            <button type="button" onClick={() => setOpenInfo((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
              <span className="font-display text-[15px] font-bold text-ink">Comprendre brut, net et coût employeur</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate transition-transform ${openInfo ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {openInfo && (
              <div className="cjv-drop space-y-2.5 border-t border-line/70 px-5 py-4 text-[13px] leading-[1.5] text-slate">
                <p><b className="text-ink">Brut</b> — le salaire indiqué au contrat.</p>
                <p><b className="text-ink">Net avant impôt</b> — le salaire après cotisations salariales.</p>
                <p><b className="text-ink">Net après impôt</b> — le montant estimé après prélèvement à la source.</p>
                <p><b className="text-ink">Coût employeur</b> — le brut plus les cotisations patronales estimées.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {valid && result && (
        <p className="mx-auto mt-5 max-w-[640px] text-center text-[12px] leading-[1.5] text-slate-soft">
          Simulation indicative, non officielle. Certaines conventions collectives ou situations particulières peuvent modifier le résultat.
        </p>
      )}
    </div>
  );
}

function ResultTile({ tone, label, value, per, big }: { tone: "brand" | "ink" | "soft"; label: string; value: number; per: Disp; big?: boolean }) {
  const styles =
    tone === "brand"
      ? "border-transparent bg-gradient-to-br from-[#E1F7EF] to-white"
      : tone === "ink"
        ? "border-transparent bg-gradient-to-br from-[#EEE7FD] to-white"
        : "border-line bg-white/85";
  return (
    <div className={`min-w-0 overflow-hidden rounded-3xl border p-5 backdrop-blur transition hover:-translate-y-[2px] hover:shadow-card ${styles}`}>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-soft">{label}</span>
      <span className={`mt-1.5 block font-extrabold leading-tight tracking-[-0.01em] text-ink ${big ? "text-[clamp(15px,4.6vw,30px)]" : "text-[clamp(14px,3.4vw,20px)]"}`}>
        <Money value={value} per={per} />
      </span>
    </div>
  );
}

function DRow({ label, value, per, badge, strong }: { label: string; value: number; per: Disp; badge?: string; strong?: boolean }) {
  const neg = value < 0;
  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface">
      <span className="flex min-w-0 items-center gap-2">
        <span className={`truncate text-[13.5px] ${strong ? "font-semibold text-ink" : "text-slate"}`}>{label}</span>
        {badge && <span className="shrink-0 rounded-full border border-line bg-white px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-soft">{badge}</span>}
      </span>
      <span className={`shrink-0 whitespace-nowrap text-[14px] font-bold [font-variant-numeric:tabular-nums] ${neg ? "text-[#C0264A]" : "text-ink"}`} style={{ wordSpacing: "0.04em" }}>
        {neg ? "− " : ""}{formatSalaryAmount(Math.abs(value))}
        <span className="ml-1 align-baseline text-[0.7em] font-normal text-slate-soft" style={{ wordSpacing: "normal" }}>/ {per}</span>
      </span>
    </div>
  );
}
