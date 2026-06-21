"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Trophy, Sparkles, BarChart3, Crown, ArrowUpRight, Compass, RotateCcw } from "lucide-react";
import {
  NET2GROSS, FR_YEAR, TOP_THRESHOLDS,
  percentileOfNetMonthly,
  MEDIAN_NET_MONTH, MEAN_NET_MONTH, TOP10_NET_MONTH, TOP1_NET_MONTH, TOP5_NET_MONTH_EST, SMIC_NET_MONTH,
} from "@/lib/salary/france-distribution";

type Fmt = "net_month" | "net_year" | "brut_month" | "brut_year";

const NBSP = "\u00A0";
const FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euro = (n: number) => FMT.format(Math.round(n)).replace(/\u202F/g, NBSP) + NBSP + "€";
const parseAmount = (s: string) => { const n = parseFloat((s || "").replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n : NaN; };

const toNetMonth = (val: number, fmt: Fmt) =>
  fmt === "net_month" ? val : fmt === "net_year" ? val / 12 : fmt === "brut_month" ? val * 0.78 : (val * 0.78) / 12;
const fromNetMonth = (nm: number, fmt: Fmt) =>
  fmt === "net_month" ? nm : fmt === "net_year" ? nm * 12 : fmt === "brut_month" ? nm * NET2GROSS : nm * 12 * NET2GROSS;
const unitOf = (fmt: Fmt) =>
  fmt === "net_month" ? { basis: "net", per: "/ mois" } : fmt === "net_year" ? { basis: "net", per: "/ an" } : fmt === "brut_month" ? { basis: "brut", per: "/ mois" } : { basis: "brut", per: "/ an" };
const showRef = (nm: number, fmt: Fmt) => { const u = unitOf(fmt); return `${euro(fromNetMonth(nm, fmt))} ${u.basis} ${u.per}`; };
const showDelta = (deltaNm: number, fmt: Fmt) => { const u = unitOf(fmt); return `${euro(fromNetMonth(Math.abs(deltaNm), fmt))} ${u.basis} ${u.per}`; };

function Seg<T extends string>({ value, onChange, options, size = "md" }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[]; size?: "md" | "sm" }) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]";
  return (
    <div className="inline-flex flex-wrap rounded-xl border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`rounded-[9px] font-semibold transition ${pad} ${value === o.v ? "bg-white text-ink shadow-soft" : "text-slate hover:text-ink"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TopFrance() {
  const [amount, setAmount] = useState("");
  const [fmt, setFmt] = useState<Fmt>("net_month");
  const [submitted, setSubmitted] = useState(0);
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [target, setTarget] = useState(10);
  const [raiseT, setRaiseT] = useState(250);
  const [customDomain, setCustomDomain] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<{ x0: number; x1: number } | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const amountValue = parseAmount(amount);
  const valid = Number.isFinite(amountValue) && amountValue > 0;

  // Position RÉELLE — pilote la jauge, la distribution, les bulles, l'objectif.
  const baseNet = useMemo(() => (submitted > 0 ? toNetMonth(submitted, fmt) : 0), [submitted, fmt]);
  const basePct = useMemo(() => percentileOfNetMonthly(baseNet), [baseNet]);
  const baseTop = Math.max(1, Math.round(100 - basePct));
  const baseMoins = Math.min(99, Math.round(basePct));

  // Simulateur — échelle d'augmentation indépendante.
  const RAISE_MAX = 12000;
  const raise = (raiseT / 1000) * RAISE_MAX;
  const simNet = baseNet + raise;
  const simPct = useMemo(() => percentileOfNetMonthly(simNet), [simNet]);
  const simTop = Math.max(1, Math.round(100 - simPct));
  const simMoins = Math.min(99, Math.round(simPct));

  useEffect(() => { setRaiseT(250); setCustomDomain(null); }, [baseNet]);

  const run = () => {
    if (!valid) return;
    setSubmitted(amountValue); setStatus("done");
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 90);
  };

  const posPhrase = baseNet >= TOP1_NET_MONTH ? "Vous faites partie du top 1 % des salaires français."
    : baseNet >= TOP10_NET_MONTH ? "Vous faites partie des 10 % les mieux payés en France."
    : baseNet >= MEAN_NET_MONTH ? "Vous êtes au-dessus du salaire moyen, mais encore sous le top 10 %."
    : baseNet >= MEDIAN_NET_MONTH ? "Vous êtes au-dessus du salaire médian, mais sous le salaire moyen."
    : baseNet >= SMIC_NET_MONTH ? "Vous êtes entre le SMIC et le salaire médian." : "Vous êtes autour du niveau du SMIC.";

  const bubbles = [
    { key: "median", label: "Médiane", v: MEDIAN_NET_MONTH },
    { key: "top10", label: "Top 10 %", v: TOP10_NET_MONTH },
    { key: "top1", label: "Top 1 %", v: TOP1_NET_MONTH },
  ].map((b) => ({ ...b, d: b.v - baseNet }));

  const targetRow = TOP_THRESHOLDS.find((t) => t.topPct === target)!;
  const targetDelta = targetRow.netMonth - baseNet;
  const targetPctDiff = baseNet > 0 ? Math.min(999, Math.round((Math.abs(targetDelta) / baseNet) * 100)) : 0;

  return (
    <div className="mx-auto max-w-[1040px]">
      {/* ---------- Formulaire ---------- */}
      <div className="cjv-toolwrap relative z-30">
        <div aria-hidden className="cjv-toolhalo" />
        <form onSubmit={(e) => { e.preventDefault(); run(); }}
          className="cjv-toolcard rounded-[28px] border border-line bg-white/85 p-5 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-7">
          <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Votre salaire</span>
              <div className="flex items-center rounded-xl border border-line bg-white px-3 transition focus-within:border-[#c7b6f2] focus-within:shadow-[0_0_0_4px_rgba(124,58,237,.08)]">
                <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="ex. 2 600"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-soft" />
                <span className="shrink-0 pl-2 text-[13px] font-medium text-slate-soft">€</span>
              </div>
            </label>
            <div>
              <span className="mb-1.5 block text-[12.5px] font-semibold text-slate">Format</span>
              <Seg<Fmt> value={fmt} onChange={setFmt} size="sm" options={[{ v: "net_month", label: "Net / mois" }, { v: "net_year", label: "Net / an" }, { v: "brut_month", label: "Brut / mois" }, { v: "brut_year", label: "Brut / an" }]} />
            </div>
          </div>
          <button type="submit" disabled={!valid}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 text-[15.5px] font-semibold text-ink shadow-[0_16px_34px_-12px_rgba(0,195,137,.65)] transition hover:-translate-y-px hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
            <Compass className="h-4 w-4" /> Voir ma position
          </button>
          <p className="mt-3 text-center text-[11.5px] text-slate-soft">Comparaison France entière · {unitOf(fmt).basis} {unitOf(fmt).per} · données INSEE {FR_YEAR} (salaires du privé, équivalent temps plein).</p>
        </form>
      </div>

      {status === "idle" && <p className="mx-auto mt-8 max-w-[460px] text-center text-[15px] text-slate">Entrez votre salaire pour découvrir votre position.</p>}

      {status === "done" && (
        <div ref={resultsRef} key={`${submitted}-${fmt}`} className="cjv-drop mt-8 space-y-7 scroll-mt-24">
          {/* ====== Carte large : position (gauche) + « Vous êtes ici » à aiguille (droite) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard grid gap-6 overflow-hidden rounded-[28px] border border-[#D9CFFA] bg-gradient-to-br from-[#F4EFFE] via-[#F8F5FF] to-white p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] md:p-8 lg:grid-cols-[1fr_minmax(300px,360px)] lg:items-center">
              {/* --- Gauche : titre + 3 bulles empilées --- */}
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D9CFFA] bg-white/70 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#6D28D9]"><Trophy className="h-3.5 w-3.5" /> Votre position en France</span>
                <p className="mt-4 font-display text-[clamp(19px,2.7vw,29px)] font-bold leading-[1.12] tracking-[-0.015em] text-ink">
                  Vous gagnez plus que <span className="text-[#6D28D9]">{baseMoins} %</span> des salariés français.
                </p>
                <p className="mt-2 text-[14.5px] font-semibold text-slate">Top {baseTop} %. {posPhrase}</p>
                <div className="mt-5 flex flex-col gap-3">
                  {bubbles.map((b) => (
                    <div key={b.key} className="group relative flex cursor-default items-center justify-between gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3 transition hover:-translate-y-0.5 hover:border-[#C9B8F0] hover:shadow-[0_18px_40px_-22px_rgba(124,58,237,.5)]">
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-bold text-ink">{b.label}</span>
                        <span className="block text-[12px] font-medium text-slate">{b.d > 0 ? "à atteindre" : "vous êtes au-dessus"}</span>
                      </span>
                      <span className="flex items-center gap-2.5">
                        <span className={`text-[16px] font-extrabold ${b.d > 0 ? "text-[#C0264A]" : "text-[#0A8F60]"}`}>{showDelta(b.d, fmt)}</span>
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${b.d > 0 ? "bg-[#FFE5EA] text-[#E11D48]" : "bg-[#E1F7EF] text-[#0A8F60]"}`}>{b.d > 0 ? <ArrowUpRight className="h-4 w-4" /> : <Crown className="h-4 w-4" />}</span>
                      </span>
                      <span className="pointer-events-none absolute left-1/2 bottom-[calc(100%+8px)] z-[90] w-max max-w-[230px] -translate-x-1/2 rounded-xl bg-ink px-3.5 py-2 text-center opacity-0 shadow-[0_16px_36px_-10px_rgba(0,0,0,.6)] transition group-hover:opacity-100">
                        <span className="block text-[12px] font-medium text-white/70">Seuil {b.label.toLowerCase()}</span>
                        <span className="mt-0.5 block text-[13px] font-bold text-white">{showRef(b.v, fmt)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- Droite : « Vous êtes ici » à aiguille (repères nommés, texte non masqué) --- */}
              <div className="rounded-[24px] border border-line bg-white/70 p-4 backdrop-blur">
                <p className="text-center text-[12.5px] font-bold uppercase tracking-[0.12em] text-slate">Vous êtes ici</p>
                {(() => {
                  const cx = 150, cy = 150, R = 120;
                  const ptOf = (p: number, rr: number) => { const th = Math.PI * (1 - Math.min(100, Math.max(0, p)) / 100); return [cx + rr * Math.cos(th), cy - rr * Math.sin(th)] as const; };
                  const th = Math.PI * (1 - Math.min(100, Math.max(0, basePct)) / 100);
                  const [tx, ty] = [cx + (R - 24) * Math.cos(th), cy - (R - 24) * Math.sin(th)];
                  const px = Math.sin(th), py = Math.cos(th); // perpendiculaire
                  const needle = `${cx + px * 5},${cy + py * 5} ${tx},${ty} ${cx - px * 5},${cy - py * 5}`;
                  const refs = [
                    { p: 50, l: "Médiane", c: "#475569", anc: "middle" as const, dx: 0, dy: -12 },
                    { p: 90, l: "Top 10 %", c: "#7C3AED", anc: "end" as const, dx: -9, dy: -3 },
                    { p: 99, l: "Top 1 %", c: "#FF4D67", anc: "end" as const, dx: -9, dy: 12 },
                  ];
                  return (
                    <svg viewBox="0 0 300 196" className="mx-auto mt-1 h-auto w-full max-w-[320px]" preserveAspectRatio="xMidYMid meet">
                      <defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#00C389" /><stop offset="0.5" stopColor="#2F6BFF" /><stop offset="0.78" stopColor="#7C3AED" /><stop offset="1" stopColor="#FF4D67" /></linearGradient></defs>
                      <path d="M30 150 A120 120 0 0 1 270 150" fill="none" stroke="#EDF0F7" strokeWidth="17" strokeLinecap="round" />
                      <path d="M30 150 A120 120 0 0 1 270 150" fill="none" stroke="url(#g5)" strokeWidth="17" strokeLinecap="round" />
                      {refs.map((r) => { const [dxp, dyp] = ptOf(r.p, R); const [lxp, lyp] = ptOf(r.p, R); return (
                        <g key={r.l}>
                          <circle cx={dxp} cy={dyp} r="4.5" fill="#fff" stroke={r.c} strokeWidth="2.5" />
                          <text x={lxp + r.dx} y={lyp + r.dy} textAnchor={r.anc} fontSize="11.5" fontWeight="800" fill={r.c}>{r.l}</text>
                        </g>
                      ); })}
                      <polygon points={needle} fill="#0F172A" />
                      <circle cx={cx} cy={cy} r="10" fill="#0F172A" /><circle cx={cx} cy={cy} r="4" fill="#fff" />
                      <text x="150" y="178" textAnchor="middle" fontSize="30" fontWeight="800" fill="#0F172A" style={{ fontFamily: "var(--font-display)" }}>top {baseTop} %</text>
                      <text x="150" y="192" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#5B6479">plus que {baseMoins} % des salariés</text>
                    </svg>
                  );
                })()}
              </div>
            </div>
          </section>
          {/* ====== Objectif de classement — carte indépendante (seuils 50/20/10/5/1, sans Top 30) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-line bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-8">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><Crown className="h-5 w-5" aria-hidden /></span>
                <h3 className="font-display text-[clamp(20px,2.6vw,26px)] font-extrabold tracking-[-0.015em] text-ink">Objectif de classement</h3>
              </div>
              <p className="mt-2 text-[13.5px] font-semibold text-slate">Choisissez un objectif — survolez un repère pour voir le salaire correspondant.</p>

              <div className="mb-10 mt-9">
                <div className="relative h-[10px] w-full rounded-full" style={{ background: "linear-gradient(90deg,#00C389,#2F6BFF 46%,#7C3AED 74%,#FF4D67)" }}>
                  {TOP_THRESHOLDS.filter((t) => [50, 20, 10, 5, 1].includes(t.topPct)).map((t, i) => {
                    const x = 100 - t.topPct; const sel = t.topPct === target;
                    const labelShown = sel || [50, 20, 10].includes(t.topPct);
                    return (
                      <div key={t.topPct} className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, zIndex: sel ? 40 : 20 - i }}>
                        <button type="button" onClick={() => setTarget(t.topPct)} aria-label={`Top ${t.topPct} %`}
                          className={`block rounded-full border-2 border-white transition ${sel ? "h-[18px] w-[18px] bg-[#6D28D9]" : "h-3 w-3 bg-[#94A3B8] hover:scale-110 hover:bg-[#6D28D9]"}`} style={{ boxShadow: sel ? "0 0 0 4px rgba(124,58,237,.25)" : "0 1px 4px rgba(15,23,42,.3)" }} />
                        {labelShown && <span className={`absolute left-1/2 top-[20px] -translate-x-1/2 whitespace-nowrap text-[11px] font-bold ${sel ? "text-[#6D28D9]" : "text-slate-soft"}`}>Top {t.topPct}</span>}
                        <span className="pointer-events-none absolute left-1/2 bottom-[calc(100%+8px)] z-[90] w-max -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-center opacity-0 shadow-[0_12px_28px_-8px_rgba(0,0,0,.6)] transition group-hover:opacity-100">
                          <span className="block text-[12px] font-bold text-white">Top {t.topPct} %</span>
                          <span className="block text-[11.5px] font-medium text-white/80">{showRef(t.netMonth, fmt)}{t.estimate ? " (est.)" : ""}</span>
                        </span>
                      </div>
                    );
                  })}
                  <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${Math.min(99, basePct)}%`, zIndex: 50 }}>
                    <span className="block h-[16px] w-[16px] rounded-full border-[3px] border-white bg-[#00C389] shadow-[0_2px_8px_rgba(0,195,137,.8)]" />
                    <span className="absolute left-1/2 -bottom-[19px] -translate-x-1/2 whitespace-nowrap text-[11px] font-bold text-[#0A8F60]">Vous</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[50, 20, 10, 5, 1].map((tp) => (
                  <button key={tp} type="button" onClick={() => setTarget(tp)}
                    className={`rounded-xl border px-2 py-2.5 text-center text-[13px] font-bold transition ${target === tp ? "border-[#7C3AED] bg-[#7C3AED] text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,.8)]" : "border-line bg-white text-slate hover:-translate-y-px hover:border-[#C9B8F0] hover:text-ink"}`}>
                    Top {tp} %
                  </button>
                ))}
              </div>

              <div key={target} className="cjv-drop mt-5 overflow-hidden rounded-2xl border border-[#E3DAFB] bg-gradient-to-br from-[#F7F4FE] to-white p-5">
                {targetDelta > 0 ? (
                  <>
                    <p className="font-display text-[clamp(18px,2.5vw,23px)] font-bold leading-[1.25] text-ink">Pour atteindre le <span className="text-[#6D28D9]">top {target} %</span>, il vous faudrait <span className="text-[#6D28D9]">{showRef(targetRow.netMonth, fmt)}</span>{targetRow.estimate ? " (estimé)" : ""}.</p>
                    <p className="mt-1.5 text-[14.5px] font-semibold text-slate">Il vous manque <b className="text-[#C0264A]">{showDelta(targetDelta, fmt)}</b> — soit ~{targetPctDiff} % de plus.</p>
                  </>
                ) : (
                  <p className="font-display text-[clamp(18px,2.5vw,23px)] font-bold leading-[1.25] text-ink">Vous êtes déjà dans le <span className="text-[#0A8F60]">top {target} %</span> 🎉<span className="mt-1 block text-[14.5px] font-semibold text-slate">Seuil : {showRef(targetRow.netMonth, fmt)}{targetRow.estimate ? " (estimé)" : ""}.</span></p>
                )}
              </div>
            </div>
          </section>

          {/* ====== Simulateur — UNE seule échelle (augmentation), curseur à 1/4 ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard relative overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-white via-white to-[#FBF8FF] p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-8">
              <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[#7C3AED]/10 blur-3xl" />
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEE7FD] text-[#6D28D9]"><Sparkles className="h-5 w-5" aria-hidden /></span>
                <h3 className="font-display text-[clamp(20px,2.6vw,26px)] font-extrabold tracking-[-0.015em] text-ink">Et si votre salaire augmentait ?</h3>
              </div>
              <p className="mt-3 flex items-center gap-2 text-balance font-display text-[clamp(18px,2.6vw,26px)] font-bold leading-[1.2] text-ink">
                {raise >= 20 ? (
                  <>
                    <ArrowUpRight className="h-6 w-6 shrink-0 text-[#0A8F60]" aria-hidden />
                    <span>Avec <span className="text-[#0A8F60]">+{showDelta(raise, fmt)}</span>, vous passeriez du top {baseTop} % au <span className="text-[#6D28D9]">top {simTop} %</span>.</span>
                  </>
                ) : (<>Faites glisser le curseur pour tester une augmentation et voir votre rang grimper.</>)}
              </p>
              <p className="mt-1 text-[13.5px] font-semibold text-slate">Salaire simulé : <b className="text-ink">{showRef(simNet, fmt)}</b> — vous dépasseriez {simMoins} % des salariés{raise >= 20 && baseTop - simTop > 0 ? ` (+${baseTop - simTop} points)` : ""}.</p>
              <div className="relative mt-9">
                <div className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#6D28D9] px-2.5 py-1 text-[12px] font-bold text-white shadow-[0_8px_18px_-6px_rgba(124,58,237,.85)] transition-[left] duration-150 ease-out" style={{ left: `${raiseT / 10}%` }}>
                  +{showDelta(raise, fmt)}
                  <span aria-hidden className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-[#6D28D9]" />
                </div>
                <input type="range" min={0} max={1000} step={1} value={raiseT} onChange={(e) => setRaiseT(Number(e.target.value))} className="cjv-range" aria-label="Augmentation simulée" />
                <div className="mt-2 flex justify-between text-[11.5px] font-medium text-slate-soft"><span>Aujourd’hui</span><span>+{showDelta(RAISE_MAX, fmt)}</span></div>
              </div>
            </div>
          </section>

          {/* ====== Distribution — zoom par sélection souris + marqueur « avec l'augmentation » ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[32px] border border-line bg-white/90 p-6 shadow-[0_40px_100px_-50px_rgba(5,9,24,.55)] backdrop-blur md:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><BarChart3 className="h-5 w-5" aria-hidden /></span>
                  <h3 className="font-display text-[clamp(20px,2.8vw,28px)] font-extrabold tracking-[-0.015em] text-ink">Votre place dans la distribution</h3>
                </div>
                {customDomain && (
                  <button type="button" onClick={() => setCustomDomain(null)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate transition hover:text-ink">
                    <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser le zoom
                  </button>
                )}
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-3 rounded-sm" style={{ background: "#7C3AED" }} /> gagnent moins que vous</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#00C389]" /> vous</span>
                {raise >= 20 && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#6D28D9]" /> avec l’augmentation</span>}
                <span className="hidden sm:inline">· cliquez-glissez sur la courbe pour zoomer.</span>
              </p>
              <div className="mt-5 select-none">
                {(() => {
                  const W = 820, H = 270, baseY = 198, peak = 150;
                  const dom = customDomain ?? [1200, 11000];
                  const lnMin = Math.log(dom[0]), lnMax = Math.log(dom[1]);
                  const mu = Math.log(MEDIAN_NET_MONTH), sigma = Math.log(TOP10_NET_MONTH / MEDIAN_NET_MONTH) / 1.2816;
                  const clampV = (v: number) => Math.min(dom[1], Math.max(dom[0], v));
                  const xP = (v: number) => ((Math.log(clampV(v)) - lnMin) / (lnMax - lnMin)) * W;
                  const invX = (x: number) => Math.exp(lnMin + (Math.max(0, Math.min(W, x)) / W) * (lnMax - lnMin));
                  const dens = (lx: number) => Math.exp(-0.5 * ((lx - mu) / sigma) ** 2);
                  const N = 84; const pts: { x: number; y: number }[] = [];
                  for (let i = 0; i <= N; i++) { const lx = lnMin + (lnMax - lnMin) * (i / N); pts.push({ x: (i / N) * W, y: baseY - peak * dens(lx) }); }
                  const curve = "M" + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
                  const area = `M0 ${baseY} L ` + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + ` L ${W} ${baseY} Z`;
                  const bxr = xP(baseNet); const byr = baseY - peak * dens(Math.log(clampV(baseNet)));
                  const sxr = xP(simNet); const syr = baseY - peak * dens(Math.log(clampV(simNet)));
                  const leftPts = pts.filter((p) => p.x <= bxr);
                  const leftArea = `M0 ${baseY} L ` + leftPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + ` L ${bxr.toFixed(1)} ${byr.toFixed(1)} L ${bxr.toFixed(1)} ${baseY} Z`;
                  const marks = [{ v: MEDIAN_NET_MONTH, l: "Médiane" }, { v: TOP10_NET_MONTH, l: "Top 10 %" }, { v: TOP1_NET_MONTH, l: "Top 1 %" }].filter((m) => m.v >= dom[0] && m.v <= dom[1]);
                  const showSim = raise >= 20 && Math.abs(sxr - bxr) > 6;
                  const hv = hoverX != null && !drag ? invX(hoverX) : null; const hp = hv != null ? Math.min(99, Math.round(percentileOfNetMonthly(hv))) : 0;
                  const htx = hoverX != null ? Math.max(60, Math.min(W - 60, hoverX)) : 0;
                  const xFrom = (e: ReactMouseEvent) => { const r = svgRef.current?.getBoundingClientRect(); if (!r) return 0; return Math.max(0, Math.min(W, ((e.clientX - r.left) / r.width) * W)); };
                  const selA = drag ? Math.min(drag.x0, drag.x1) : 0; const selB = drag ? Math.max(drag.x0, drag.x1) : 0;
                  return (
                    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[560px] cursor-crosshair md:min-w-0" preserveAspectRatio="xMidYMid meet"
                      onMouseDown={(e) => { setHoverX(null); const x = xFrom(e); setDrag({ x0: x, x1: x }); }}
                      onMouseMove={(e) => { const x = xFrom(e); if (drag) setDrag((d) => (d ? { ...d, x1: x } : null)); else setHoverX(x); }}
                      onMouseUp={() => { if (drag) { const a = Math.min(drag.x0, drag.x1), b = Math.max(drag.x0, drag.x1); if (b - a > 22) { const lo = invX(a), hi = invX(b); setCustomDomain([Math.min(lo, hi), Math.max(lo, hi)]); } setDrag(null); } }}
                      onMouseLeave={() => { setDrag(null); setHoverX(null); }}>
                      <defs>
                        <linearGradient id="tfF5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6E9F2" stopOpacity="0.7" /><stop offset="1" stopColor="#E6E9F2" stopOpacity="0.1" /></linearGradient>
                        <linearGradient id="tfL5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C3AED" stopOpacity="0.55" /><stop offset="1" stopColor="#7C3AED" stopOpacity="0.08" /></linearGradient>
                      </defs>
                      <path d={area} fill="url(#tfF5)" />
                      <path d={leftArea} fill="url(#tfL5)" />
                      {showSim && <rect x={Math.min(bxr, sxr)} y={28} width={Math.abs(sxr - bxr)} height={baseY - 28} fill="#6D28D9" fillOpacity="0.08" />}
                      <path d={curve} fill="none" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="#E6E9F2" strokeWidth="1" />
                      {marks.map((m) => { const x = xP(m.v); return (
                        <g key={m.l}>
                          <line x1={x} y1={baseY} x2={x} y2={baseY - peak * dens(Math.log(m.v)) - 6} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
                          <text x={x} y={baseY + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#8A93A8">{m.l}</text>
                        </g>
                      ); })}
                      {/* marqueur simulé (lié au module d'augmentation) */}
                      {showSim && (<g>
                        <line x1={sxr} y1={syr - 4} x2={sxr} y2={baseY} stroke="#6D28D9" strokeWidth="2" strokeDasharray="4 3" />
                        <circle cx={sxr} cy={syr} r="6" fill="#6D28D9" stroke="#fff" strokeWidth="2.5" />
                        <rect x={Math.min(W - 64, Math.max(0, sxr - 32))} y={Math.max(2, syr - 36)} width="64" height="22" rx="7" fill="#6D28D9" />
                        <text x={Math.min(W - 32, Math.max(32, sxr))} y={Math.max(17, syr - 21)} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">simulé</text>
                      </g>)}
                      {/* utilisateur */}
                      <line x1={bxr} y1={byr - 4} x2={bxr} y2={baseY} stroke="#00A06E" strokeWidth="2.5" />
                      <circle cx={bxr} cy={byr} r="7" fill="#00C389" stroke="#fff" strokeWidth="3" />
                      <rect x={Math.min(W - 80, Math.max(0, bxr - 40))} y={Math.max(2, byr - 14)} width="80" height="24" rx="8" fill="#00C389" />
                      <text x={Math.min(W - 40, Math.max(40, bxr))} y={Math.max(18, byr + 2)} textAnchor="middle" fontSize="12" fontWeight="800" fill="#0F172A">Vous</text>
                      {/* sélection de zoom */}
                      {drag && selB - selA > 2 && (<g>
                        <rect x={selA} y={28} width={selB - selA} height={baseY - 28} fill="#2F6BFF" fillOpacity="0.12" stroke="#2F6BFF" strokeOpacity="0.5" strokeDasharray="4 3" />
                      </g>)}
                      {/* survol précis */}
                      {hoverX != null && hv != null && (
                        <g>
                          <line x1={hoverX} y1={28} x2={hoverX} y2={baseY} stroke="#7C3AED" strokeWidth="1" strokeDasharray="4 3" opacity="0.8" />
                          <rect x={htx - 58} y={6} width="116" height="38" rx="9" fill="#0F172A" />
                          <text x={htx} y={22} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">≈ {showRef(hv, fmt)}</text>
                          <text x={htx} y={37} textAnchor="middle" fontSize="11" fontWeight="600" fill="rgba(255,255,255,.82)">vous battez {hp} %</text>
                        </g>
                      )}
                    </svg>
                  );
                })()}
              </div>
              <p className="mt-3 text-[12px] text-slate-soft">Le marqueur violet montre où l’augmentation simulée vous placerait. Cliquez-glissez pour zoomer sur une tranche, puis « Réinitialiser le zoom ». Source : INSEE {FR_YEAR}.</p>
            </div>
          </section>

          {/* ====== Ce qu'il vous manque — remplissage propre à CHAQUE seuil ====== */}
          {(() => {
            const refs = [{ l: "le salaire médian", verb: "dépasser", v: MEDIAN_NET_MONTH }, { l: "le salaire moyen", verb: "dépasser", v: MEAN_NET_MONTH }, { l: "le top 10 %", verb: "entrer dans", v: TOP10_NET_MONTH }, { l: "le top 5 %", verb: "entrer dans", v: TOP5_NET_MONTH_EST }, { l: "le top 1 %", verb: "entrer dans", v: TOP1_NET_MONTH }];
            const next = refs.filter((r) => r.v > baseNet).sort((a, b) => a.v - b.v).slice(0, 3);
            const passedMedian = baseNet >= MEDIAN_NET_MONTH;
            return (
              <section className="rounded-[32px] border border-[#D9CFFA] bg-gradient-to-br from-[#F4EFFE] via-[#F8F5FF] to-white p-6 shadow-[0_40px_100px_-50px_rgba(124,58,237,.3)] md:p-9">
                <div className="flex items-center gap-2.5"><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#6D28D9] shadow-[0_6px_16px_-8px_rgba(124,58,237,.6)]"><ArrowUpRight className="h-5 w-5" aria-hidden /></span><h3 className="font-display text-[clamp(20px,2.8vw,27px)] font-extrabold tracking-[-0.015em] text-ink">Ce qu’il vous manque pour passer au-dessus</h3></div>
                {passedMedian && <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#E1F7EF] px-3 py-1 text-[13px] font-semibold text-[#0A8F60]">✓ Déjà au-dessus du salaire médian</p>}
                {!next.length ? (
                  <p className="mt-4 text-[16px] font-semibold text-ink">Vous êtes au sommet de la distribution des salaires français. 🎉</p>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {next.map((r) => { const pctTo = Math.max(3, Math.min(98, Math.round((baseNet / r.v) * 100))); return (
                      <div key={r.l} className="group rounded-2xl border border-[#E3DAFB] bg-white/85 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(124,58,237,.5)]">
                        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6D28D9]">{r.l.replace("le ", "")}</span>
                        <span className="mt-1 block font-display text-[20px] font-extrabold text-ink">{showDelta(r.v - baseNet, fmt)}</span>
                        <span className="text-[13px] font-medium text-slate">pour {r.verb} {r.l}</span>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEE7FD]"><div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-700" style={{ width: `${pctTo}%` }} /></div>
                          <span className="shrink-0 text-[11.5px] font-bold text-[#6D28D9]">{pctTo} %</span>
                        </div>
                        <span className="mt-1 block text-[11px] font-medium text-slate-soft">du seuil déjà atteint</span>
                      </div>
                    ); })}
                  </div>
                )}
              </section>
            );
          })()}

        </div>
      )}
    </div>
  );
}
