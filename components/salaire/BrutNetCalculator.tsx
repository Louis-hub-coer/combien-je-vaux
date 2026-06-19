"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, Info, Sparkles, Lightbulb } from "lucide-react";
import {
  calculateFromGross,
  calculateFromNet,
  buildBrutNetChartData,
  formatSalaryAmount,
  type Status,
  type Period,
  type BrutNetResult,
} from "@/lib/salary/brutNet";
import { TAX_YEAR_LABEL } from "@/lib/salary/french-salary-constants";

type Mode = "rapide" | "avance" | "precis";
type Direction = "brut" | "net";
type NetBasis = "before" | "after";
type Situation = "celibataire" | "marie" | "parent_isole";

const MODES: { key: Mode; label: string; promise: string }[] = [
  { key: "rapide", label: "Rapide", promise: "Une estimation en 10 secondes." },
  { key: "avance", label: "Avancé", promise: "Ajoutez les éléments qui changent le résultat." },
  { key: "precis", label: "Précis", promise: "Simulation détaillée avec fiscalité." },
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
function computeParts(situation: Situation, children: number, parentIsole: boolean): number {
  let p = situation === "marie" ? 2 : 1;
  p += Math.min(children, 2) * 0.5 + Math.max(0, children - 2) * 1;
  if (situation !== "marie" && parentIsole && children > 0) p += 0.5;
  return p;
}

/* — petits composants UI — */
function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`rounded-[9px] px-3 py-1.5 text-[13px] font-semibold transition ${value === o.v ? "bg-white text-ink shadow-soft" : "text-slate hover:text-ink"}`}
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
    <div className="flex items-center rounded-xl border border-line bg-white px-3 focus-within:border-[#c7b6f2]">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-soft"
      />
      {suffix && <span className="pl-2 text-[13px] font-medium text-slate-soft">{suffix}</span>}
    </div>
  );
}
function Money({ value, per, className = "" }: { value: number; per: "mois" | "an"; className?: string }) {
  return (
    <span className={`whitespace-nowrap [font-variant-numeric:tabular-nums] ${className}`} style={{ wordSpacing: "0.06em" }}>
      {formatSalaryAmount(value)}
      <span className="ml-1 font-normal text-slate-soft" style={{ wordSpacing: "normal" }}>/ {per}</span>
    </span>
  );
}

export function BrutNetCalculator() {
  const [mode, setMode] = useState<Mode>("rapide");
  const [direction, setDirection] = useState<Direction>("brut");
  const [netBasis, setNetBasis] = useState<NetBasis>("before");

  // champs communs
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<Period>("mensuel");
  const [status, setStatus] = useState<Status>("cadre");
  const [contract, setContract] = useState<"CDI" | "CDD">("CDI");
  const [partTime, setPartTime] = useState(false);
  const [partPct, setPartPct] = useState("80");

  // avancé
  const [bonus, setBonus] = useState("");
  const [thirteenth, setThirteenth] = useState(false);
  const [pas, setPas] = useState("");
  const [mutuelle, setMutuelle] = useState("");
  const [tickets, setTickets] = useState("");

  // précis
  const [situation, setSituation] = useState<Situation>("celibataire");
  const [children, setChildren] = useState("0");
  const [taxChoice, setTaxChoice] = useState<"bareme" | "pas">("bareme");

  const amountValue = parseAmount(amount);
  const valid = Number.isFinite(amountValue) && amountValue > 0;

  const parts = useMemo(
    () => computeParts(situation, Math.max(0, parseInt(children || "0", 10) || 0), situation === "parent_isole"),
    [situation, children],
  );

  const result: BrutNetResult | null = useMemo(() => {
    if (!valid) return null;
    const partTimePercent = partTime ? Math.min(100, Math.max(1, parseFloat(partPct) || 100)) : 100;
    const pasRate = pas.trim() ? Math.min(1, Math.max(0, (parseFloat(pas.replace(",", ".")) || 0) / 100)) : null;

    const opts =
      mode === "rapide"
        ? { status, parts: 1, isCouple: false, taxMode: "bareme" as const }
        : mode === "avance"
          ? {
              status,
              parts: 1,
              isCouple: false,
              mutuelleMonthly: parseFloat(mutuelle) || 0,
              ticketsRestoMonthly: parseFloat(tickets) || 0,
              pasRate,
              taxMode: pasRate != null ? ("pas" as const) : ("bareme" as const),
            }
          : {
              status,
              parts,
              isCouple: situation === "marie",
              mutuelleMonthly: parseFloat(mutuelle) || 0,
              ticketsRestoMonthly: parseFloat(tickets) || 0,
              pasRate,
              taxMode: taxChoice === "pas" && pasRate != null ? ("pas" as const) : ("bareme" as const),
            };

    if (direction === "net") {
      return calculateFromNet(period === "mensuel" ? amountValue : amountValue / 12, netBasis, opts);
    }
    return calculateFromGross(
      {
        amount: amountValue,
        period,
        partTimePercent,
        thirteenthMonth: mode !== "rapide" ? thirteenth : false,
        bonusAnnual: mode !== "rapide" ? parseFloat(bonus) || 0 : 0,
      },
      opts,
    );
  }, [valid, amountValue, period, status, mode, direction, netBasis, partTime, partPct, bonus, thirteenth, pas, mutuelle, tickets, parts, situation, taxChoice]);

  const bars = result ? buildBrutNetChartData(result) : [];
  const maxBar = bars.length ? Math.max(...bars.map((b) => b.value)) : 1;

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
        {/* ---------- Colonne formulaire ---------- */}
        <div className="rounded-3xl border border-line bg-white/85 p-5 backdrop-blur md:p-6">
          <div className="grid gap-4">
            <Field label={direction === "brut" ? "Montant brut" : netBasis === "before" ? "Net mensuel avant impôt" : "Net mensuel après impôt"}>
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
                <Seg<Period>
                  value={period}
                  onChange={setPeriod}
                  options={[
                    { v: "mensuel", label: "Mensuel" },
                    { v: "annuel", label: "Annuel" },
                  ]}
                />
              )}
              <Seg<Status>
                value={status}
                onChange={setStatus}
                options={[
                  { v: "cadre", label: "Cadre" },
                  { v: "non-cadre", label: "Non-cadre" },
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Seg<"CDI" | "CDD">
                value={contract}
                onChange={setContract}
                options={[
                  { v: "CDI", label: "CDI" },
                  { v: "CDD", label: "CDD" },
                ]}
              />
              <div className="flex items-center gap-3">
                <Seg<"plein" | "partiel">
                  value={partTime ? "partiel" : "plein"}
                  onChange={(v) => setPartTime(v === "partiel")}
                  options={[
                    { v: "plein", label: "Temps plein" },
                    { v: "partiel", label: "Temps partiel" },
                  ]}
                />
                {partTime && <div className="w-[92px]"><NumberInput value={partPct} onChange={setPartPct} suffix="%" /></div>}
              </div>
            </div>

            {/* Extras (Avancé + Précis) */}
            {mode !== "rapide" && (
              <div className="mt-1 grid gap-4 rounded-2xl border border-line bg-surface/60 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-soft">Éléments complémentaires</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Bonus annuel"><NumberInput value={bonus} onChange={setBonus} placeholder="0" suffix="€" /></Field>
                  <Field label="Mutuelle (part salarié)"><NumberInput value={mutuelle} onChange={setMutuelle} placeholder="0" suffix="€/mois" /></Field>
                  <Field label="Tickets resto (part salarié)"><NumberInput value={tickets} onChange={setTickets} placeholder="0" suffix="€/mois" /></Field>
                  <Field label="Taux de prélèvement à la source" hint="Laissez vide pour une estimation par le barème.">
                    <NumberInput value={pas} onChange={setPas} placeholder="ex. 7,5" suffix="%" />
                  </Field>
                </div>
                <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
                  <input type="checkbox" checked={thirteenth} onChange={(e) => setThirteenth(e.target.checked)} className="h-4 w-4 accent-[#00C389]" />
                  13ᵉ mois (si saisie mensuelle)
                </label>
              </div>
            )}

            {/* Fiscalité (Précis) */}
            {mode === "precis" && (
              <div className="grid gap-4 rounded-2xl border border-line bg-surface/60 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-soft">Situation fiscale</p>
                <Seg<Situation>
                  value={situation}
                  onChange={setSituation}
                  options={[
                    { v: "celibataire", label: "Célibataire" },
                    { v: "marie", label: "Marié / pacsé" },
                    { v: "parent_isole", label: "Parent isolé" },
                  ]}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Enfants à charge"><NumberInput value={children} onChange={setChildren} placeholder="0" /></Field>
                  <Field label="Parts fiscales" hint="Calculé automatiquement.">
                    <div className="rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] font-semibold text-ink">{parts.toLocaleString("fr-FR")}</div>
                  </Field>
                </div>
                <Seg<"bareme" | "pas">
                  value={taxChoice}
                  onChange={setTaxChoice}
                  options={[
                    { v: "bareme", label: "Estimer via le barème" },
                    { v: "pas", label: "Utiliser mon taux PAS" },
                  ]}
                />
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

        {/* ---------- Colonne résultat ---------- */}
        <div>
          {!valid && (
            <div className="rounded-3xl border border-dashed border-line bg-white/70 px-6 py-12 text-center backdrop-blur">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-tint text-brand-dark"><ArrowRightLeft className="h-5 w-5" /></span>
              <h2 className="mt-4 font-display text-[19px] font-bold text-ink">Entrez un montant valide pour lancer la simulation.</h2>
              <p className="mx-auto mt-2 max-w-[360px] text-[14px] text-slate">Choisissez un mode, saisissez un salaire brut (ou net) et le résultat s’affiche aussitôt.</p>
            </div>
          )}

          {valid && result && (
            <div className="cjv-drop space-y-5">
              {/* Résultat principal */}
              <div className="grid grid-cols-2 gap-3">
                <ResultTile tone="brand" label="Net avant impôt" value={result.netBeforeTaxMonthly} per="mois" big />
                <ResultTile tone="ink" label="Net après impôt" value={result.netAfterTaxMonthly} per="mois" big />
                <ResultTile tone="soft" label="Net annuel après impôt" value={result.netAfterTaxAnnual} per="an" />
                <ResultTile tone="soft" label="Coût employeur estimé" value={result.employerCostAnnual} per="an" />
              </div>

              {/* Graphique barres */}
              <div className="rounded-3xl border border-line bg-white/85 p-5 backdrop-blur">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-soft">Du coût employeur au net (par an)</p>
                <div className="space-y-2.5">
                  {bars.map((b) => (
                    <div key={b.key}>
                      <div className="mb-1 flex items-center justify-between text-[12.5px]">
                        <span className="font-medium text-slate">{b.label}</span>
                        <span className="font-bold text-ink [font-variant-numeric:tabular-nums]" style={{ wordSpacing: "0.06em" }}>{formatSalaryAmount(b.value)}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
                        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(3, (b.value / maxBar) * 100)}%`, background: b.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Détail + hypothèses + pédagogie (sous toute la largeur) */}
      {valid && result && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-line bg-white/85 p-5 backdrop-blur md:p-6">
            <h3 className="font-display text-[16px] font-bold text-ink">Détail de l’estimation</h3>
            <div className="mt-3 divide-y divide-line/70">
              <DetailRow label="Salaire brut annuel" value={result.grossAnnual} />
              <DetailRow label="Cotisations salariales estimées" value={-result.employeeContributions} note={`${Math.round(result.employeeRate * 100)} %`} />
              <DetailRow label="Net avant impôt" value={result.netBeforeTaxAnnual} strong />
              <DetailRow label={result.taxSource === "pas" ? "Prélèvement à la source" : "Impôt estimé (barème)"} value={-result.incomeTaxAnnual} note={`${(result.pasRateUsed * 100).toFixed(1)} %`} />
              <DetailRow label="Net après impôt" value={result.netAfterTaxAnnual} strong />
              <DetailRow label="Cotisations employeur estimées" value={result.employerContributions} />
              <DetailRow label="Coût employeur total" value={result.employerCostAnnual} strong />
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-line bg-white/85 p-5 backdrop-blur">
              <h3 className="flex items-center gap-1.5 font-display text-[15px] font-bold text-ink"><Info className="h-4 w-4 text-brand-dark" aria-hidden /> Hypothèses utilisées</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  `Statut : ${status === "cadre" ? "cadre" : "non-cadre"}`,
                  `Contrat : ${contract}`,
                  direction === "brut" ? `Période : ${period}` : `Saisie : net ${netBasis === "before" ? "avant impôt" : "après impôt"}`,
                  partTime ? `Temps partiel : ${partPct} %` : "Temps plein",
                  result.taxSource === "pas" ? `PAS : ${(result.pasRateUsed * 100).toFixed(1)} %` : "Impôt : barème",
                  `Parts : ${parts.toLocaleString("fr-FR")}`,
                  "Abattement 10 %",
                  TAX_YEAR_LABEL,
                ].map((h) => (
                  <span key={h} className="rounded-full border border-line bg-white px-2.5 py-1 text-[11.5px] font-medium text-slate">{h}</span>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] leading-[1.5] text-slate-soft">
                Simulation indicative. Conventions collectives, primes, exonérations, heures supplémentaires et cas particuliers peuvent modifier le résultat réel. Ce n’est pas un bulletin de paie officiel.
              </p>
            </div>

            <div className="rounded-3xl border border-line bg-white/85 p-5 backdrop-blur">
              <h3 className="flex items-center gap-1.5 font-display text-[15px] font-bold text-ink"><Lightbulb className="h-4 w-4 text-amber-500" aria-hidden /> Brut, net avant impôt, net après impôt ?</h3>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-slate">
                Le <b className="text-ink">brut</b> est le salaire inscrit au contrat. Le <b className="text-ink">net avant impôt</b> est ce que vous percevez une fois les cotisations salariales retirées. Le <b className="text-ink">net après impôt</b> correspond à ce qu’il reste après le prélèvement à la source. Le <b className="text-ink">coût employeur</b> ajoute au brut les cotisations patronales.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultTile({ tone, label, value, per, big }: { tone: "brand" | "ink" | "soft"; label: string; value: number; per: "mois" | "an"; big?: boolean }) {
  const styles =
    tone === "brand"
      ? "border-transparent bg-gradient-to-br from-[#E1F7EF] to-white"
      : tone === "ink"
        ? "border-transparent bg-gradient-to-br from-[#EEE7FD] to-white"
        : "border-line bg-white/85";
  return (
    <div className={`rounded-3xl border p-5 backdrop-blur ${styles}`}>
      <span className="block text-[11.5px] font-semibold uppercase tracking-[0.1em] text-slate-soft">{label}</span>
      <span className={`mt-1.5 block font-extrabold tracking-[-0.02em] text-ink ${big ? "text-[clamp(22px,4.4vw,32px)]" : "text-[clamp(18px,3.2vw,24px)]"}`}>
        <Money value={value} per={per} />
      </span>
    </div>
  );
}

function DetailRow({ label, value, note, strong }: { label: string; value: number; note?: string; strong?: boolean }) {
  const negative = value < 0;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className={`text-[13.5px] ${strong ? "font-semibold text-ink" : "text-slate"}`}>{label}</span>
      <span className="flex items-center gap-2 whitespace-nowrap">
        {note && <span className="text-[11.5px] text-slate-soft">{note}</span>}
        <span className={`text-[14px] font-bold [font-variant-numeric:tabular-nums] ${negative ? "text-[#C0264A]" : "text-ink"}`} style={{ wordSpacing: "0.06em" }}>
          {negative ? "− " : ""}{formatSalaryAmount(Math.abs(value))}
          <span className="ml-1 font-normal text-slate-soft" style={{ wordSpacing: "normal" }}>/ an</span>
        </span>
      </span>
    </div>
  );
}
