"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Trophy, Sparkles, Target, BarChart3, Compass, ArrowUpRight, Crown, Gauge } from "lucide-react";
import {
  NET2GROSS, FR_YEAR, GAUGE_REFS, TOP_THRESHOLDS,
  percentileOfNetMonthly,
  MEDIAN_NET_MONTH, MEAN_NET_MONTH, TOP10_NET_MONTH, TOP1_NET_MONTH, TOP5_NET_MONTH_EST, SMIC_NET_MONTH,
} from "@/lib/salary/france-distribution";

type Fmt = "net_month" | "net_year" | "brut_month" | "brut_year";

const NBSP = "\u00A0";
const FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euro = (n: number) => FMT.format(Math.round(n)).replace(/\u202F/g, NBSP) + NBSP + "€";
const parseAmount = (s: string) => { const n = parseFloat((s || "").replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n : NaN; };

// Conversions — valeurs internes en NET MENSUEL.
const toNetMonth = (val: number, fmt: Fmt) =>
  fmt === "net_month" ? val : fmt === "net_year" ? val / 12 : fmt === "brut_month" ? val * 0.78 : (val * 0.78) / 12;
const fromNetMonth = (nm: number, fmt: Fmt) =>
  fmt === "net_month" ? nm : fmt === "net_year" ? nm * 12 : fmt === "brut_month" ? nm * NET2GROSS : nm * 12 * NET2GROSS;
const unitOf = (fmt: Fmt) =>
  fmt === "net_month" ? { basis: "net", per: "/ mois" } : fmt === "net_year" ? { basis: "net", per: "/ an" } : fmt === "brut_month" ? { basis: "brut", per: "/ mois" } : { basis: "brut", per: "/ an" };
const showRef = (nm: number, fmt: Fmt) => { const u = unitOf(fmt); return `${euro(fromNetMonth(nm, fmt))} ${u.basis} ${u.per}`; };
const showDelta = (deltaNm: number, fmt: Fmt) => { const u = unitOf(fmt); return `${euro(fromNetMonth(Math.abs(deltaNm), fmt))} ${u.basis} ${u.per}`; };

const REF_COLOR: Record<string, string> = { smic: "#64748B", median: "#475569", mean: "#2F6BFF", top10: "#7C3AED", top5: "#A855F7", top1: "#FF4D67" };

// Slider d'augmentation : échelle logarithmique (salaire simulé net mensuel).
const SMIN = 900, SMAX = 18000, LNA = Math.log(SMIN), LNB = Math.log(SMAX);
const tFromNet = (nm: number) => Math.round(((Math.log(Math.min(SMAX, Math.max(SMIN, nm))) - LNA) / (LNB - LNA)) * 1000);
const netFromT = (t: number) => Math.round(Math.exp(LNA + (t / 1000) * (LNB - LNA)) / 10) * 10;

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
  const [submitted, setSubmitted] = useState(0); // montant brut saisi (dans le format choisi)
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [simT, setSimT] = useState(0);   // position du slider (0..1000, échelle log)
  const [target, setTarget] = useState(10);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const amountValue = parseAmount(amount);
  const valid = Number.isFinite(amountValue) && amountValue > 0;

  // Position recalculée À CHAQUE changement de format (corrige l'incohérence net/brut · mois/an).
  const baseNet = useMemo(() => (submitted > 0 ? toNetMonth(submitted, fmt) : 0), [submitted, fmt]);
  useEffect(() => { if (baseNet > 0) setSimT(tFromNet(baseNet)); }, [baseNet]);

  const run = () => {
    if (!valid) return;
    setSubmitted(amountValue); setStatus("done");
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 90);
  };

  const simNet = netFromT(simT);
  const effNet = simNet; // le simulateur pilote jauge + courbe + bulles + manque
  const basePct = useMemo(() => percentileOfNetMonthly(baseNet), [baseNet]);
  const effPct = useMemo(() => percentileOfNetMonthly(effNet), [effNet]);
  const baseTop = Math.max(1, Math.round(100 - basePct));
  const effTop = Math.max(1, Math.round(100 - effPct));
  const baseMoins = Math.min(99, Math.round(basePct));
  const effMoins = Math.min(99, Math.round(effPct));
  const simDelta = simNet - baseNet;

  const posPhrase = baseNet >= TOP1_NET_MONTH ? "Vous faites partie du top 1 % des salaires français."
    : baseNet >= TOP10_NET_MONTH ? "Vous faites partie des 10 % les mieux payés en France."
    : baseNet >= MEAN_NET_MONTH ? "Vous êtes au-dessus du salaire moyen, mais encore sous le top 10 %."
    : baseNet >= MEDIAN_NET_MONTH ? "Vous êtes au-dessus du salaire médian, mais sous le salaire moyen."
    : baseNet >= SMIC_NET_MONTH ? "Vous êtes entre le SMIC et le salaire médian." : "Vous êtes autour du niveau du SMIC.";

  const bubbles = [
    { key: "median", label: "Médiane", v: MEDIAN_NET_MONTH },
    { key: "top10", label: "Top 10 %", v: TOP10_NET_MONTH },
    { key: "top1", label: "Top 1 %", v: TOP1_NET_MONTH },
  ].map((b) => ({ ...b, d: b.v - effNet }));

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
          {/* ====== Résultat principal + bulles ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-[#D9CFFA] bg-gradient-to-br from-[#F4EFFE] via-[#F8F5FF] to-white p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] md:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D9CFFA] bg-white/70 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#6D28D9]"><Trophy className="h-3.5 w-3.5" /> Votre position en France</span>
              <p className="mt-4 font-display text-[clamp(19px,2.9vw,31px)] font-bold leading-[1.12] tracking-[-0.015em] text-ink">
                Vous gagnez plus que <span className="text-[#6D28D9]">{baseMoins} %</span> des salariés français.
              </p>
              <p className="mt-2 text-[15px] font-semibold text-slate">Votre salaire vous place dans le <b className="text-ink">top {baseTop} %</b>. {posPhrase}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {bubbles.map((b) => (
                  <div key={b.key} className="group relative cursor-default rounded-2xl border border-line bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-[#C9B8F0] hover:shadow-[0_18px_40px_-22px_rgba(124,58,237,.5)]">
                    <span className="flex items-center justify-between">
                      <span className="text-[12.5px] font-bold text-ink">{b.label}</span>
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${b.d > 0 ? "bg-[#FFE5EA] text-[#E11D48]" : "bg-[#E1F7EF] text-[#0A8F60]"}`}>{b.d > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}</span>
                    </span>
                    <span className={`mt-1.5 block text-[18px] font-extrabold ${b.d > 0 ? "text-[#C0264A]" : "text-[#0A8F60]"}`}>{showDelta(b.d, fmt)}</span>
                    <span className="text-[12.5px] font-medium text-slate">{b.d > 0 ? "à atteindre" : "au-dessus du seuil"}</span>
                    <span className="pointer-events-none absolute left-1/2 bottom-[calc(100%+8px)] z-[90] w-max max-w-[230px] -translate-x-1/2 rounded-xl bg-ink px-3.5 py-2.5 text-center opacity-0 shadow-[0_16px_36px_-10px_rgba(0,0,0,.6)] transition group-hover:opacity-100">
                      <span className="block text-[12px] font-medium text-white/70">Seuil {b.label.toLowerCase()}</span>
                      <span className="mt-0.5 block text-[13px] font-bold text-white">{showRef(b.v, fmt)}</span>
                      <span className="mt-0.5 block text-[12px] font-medium text-white/80">{b.d > 0 ? `Il vous manque ${showDelta(b.d, fmt)}` : `Vous êtes au-dessus de ${showDelta(b.d, fmt)}`}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ====== Simulateur (slider log épais, salaire simulé) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard relative overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-white via-white to-[#FBF8FF] p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-8">
              <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[#7C3AED]/10 blur-3xl" />
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEE7FD] text-[#6D28D9]"><Sparkles className="h-5 w-5" aria-hidden /></span>
                <h3 className="font-display text-[clamp(20px,2.6vw,26px)] font-extrabold tracking-[-0.015em] text-ink">Et si votre salaire augmentait ?</h3>
              </div>
              <p className="mt-3 flex items-center gap-2 text-balance font-display text-[clamp(18px,2.6vw,26px)] font-bold leading-[1.2] text-ink">
                {Math.abs(simDelta) >= 20 ? (
                  <>
                    <ArrowUpRight className={`h-6 w-6 shrink-0 ${simDelta > 0 ? "text-[#0A8F60]" : "rotate-90 text-[#C0264A]"}`} aria-hidden />
                    <span>Avec <span className={simDelta > 0 ? "text-[#0A8F60]" : "text-[#C0264A]"}>{simDelta > 0 ? "+" : "−"}{showDelta(simDelta, fmt)}</span>, vous {simDelta > 0 ? "passeriez" : "redescendriez"} du top {baseTop} % au <span className="text-[#6D28D9]">top {effTop} %</span>.</span>
                  </>
                ) : (<>Faites glisser le curseur : voyez votre progression (ou recul) dans le classement français.</>)}
              </p>
              <p className="mt-1 text-[13.5px] font-semibold text-slate">Salaire simulé : <b className="text-ink">{showRef(simNet, fmt)}</b> — vous dépasseriez {effMoins} % des salariés{simDelta > 0 && baseTop - effTop > 0 ? ` (+${baseTop - effTop} points)` : ""}.</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-soft">
                  <span>Votre rang en France</span>
                  <span className="text-[#6D28D9]">vous battez {effMoins} %</span>
                </div>
                <div className="relative mt-1.5 h-3 overflow-hidden rounded-full bg-[#EEE7FD]">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-[width] duration-500 ease-out" style={{ width: `${Math.max(2, effMoins)}%` }} />
                  <span aria-hidden className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#7C3AED] shadow-[0_2px_8px_rgba(124,58,237,.75)] transition-[left] duration-500 ease-out" style={{ left: `${Math.max(2, effMoins)}%` }} />
                </div>
              </div>
              <input type="range" min={0} max={1000} step={1} value={simT} onChange={(e) => setSimT(Number(e.target.value))} className="cjv-range mt-5" aria-label="Salaire simulé" />
              <div className="mt-2 flex justify-between text-[11.5px] font-medium text-slate-soft"><span>{showRef(SMIN, fmt)}</span><span className="text-[#6D28D9]">Votre point de départ ↑</span><span>{showRef(SMAX, fmt)}</span></div>
            </div>
          </section>
          {/* ====== Vous êtes ici — JAUGE EN ARC (identité propre, ≠ échelle comparateur) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[32px] border border-line bg-gradient-to-b from-white to-[#FBFCFF] p-6 shadow-[0_40px_100px_-50px_rgba(5,9,24,.55)] backdrop-blur md:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><Gauge className="h-5 w-5" aria-hidden /></span>
                  <h3 className="font-display text-[clamp(20px,2.8vw,28px)] font-extrabold tracking-[-0.015em] text-ink">Vous êtes ici</h3>
                </div>
                <span className="rounded-full bg-[#EEE7FD] px-3 py-1 text-[12.5px] font-bold text-[#6D28D9]">top {effTop} %</span>
              </div>
              <div className="mx-auto mt-2 max-w-[460px]">
                {(() => {
                  const cx = 210, cy = 210, R = 165;
                  const ptOf = (p: number) => { const th = Math.PI * (1 - Math.min(100, Math.max(0, p)) / 100); return [cx + R * Math.cos(th), cy - R * Math.sin(th)] as const; };
                  const lblOf = (p: number, rr: number) => { const th = Math.PI * (1 - Math.min(100, Math.max(0, p)) / 100); return [cx + rr * Math.cos(th), cy - rr * Math.sin(th)] as const; };
                  const needleDeg = (effPct - 50) * 1.8;
                  const marks = [{ p: 50, l: "Médiane", c: "#475569" }, { p: 90, l: "Top 10 %", c: "#7C3AED" }, { p: 99, l: "Top 1 %", c: "#FF4D67" }];
                  return (
                    <svg viewBox="0 0 420 244" className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
                      <defs><linearGradient id="arcg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#00C389" /><stop offset="0.46" stopColor="#2F6BFF" /><stop offset="0.74" stopColor="#7C3AED" /><stop offset="1" stopColor="#FF4D67" /></linearGradient></defs>
                      <path d="M45 210 A165 165 0 0 1 375 210" fill="none" stroke="#EDF0F7" strokeWidth="24" strokeLinecap="round" />
                      <path d="M45 210 A165 165 0 0 1 375 210" fill="none" stroke="url(#arcg)" strokeWidth="24" strokeLinecap="round" />
                      {marks.map((m) => { const [dx, dy] = ptOf(m.p); const [lxp, lyp] = lblOf(m.p, R + 24); return (
                        <g key={m.l}>
                          <circle cx={dx} cy={dy} r="5.5" fill="#fff" stroke={m.c} strokeWidth="3" />
                          <text x={lxp} y={lyp} textAnchor={m.p < 50 ? "end" : m.p > 50 ? "start" : "middle"} fontSize="11" fontWeight="700" fill={m.c}>{m.l}</text>
                        </g>
                      ); })}
                      <text x="45" y="234" textAnchor="middle" fontSize="11" fontWeight="600" fill="#8A93A8">0 %</text>
                      <text x="375" y="234" textAnchor="middle" fontSize="11" fontWeight="600" fill="#8A93A8">100 %</text>
                      {/* aiguille (pivote avec le simulateur) */}
                      <g style={{ transform: `rotate(${needleDeg}deg)`, transformOrigin: "210px 210px", transition: "transform .6s cubic-bezier(.22,1,.36,1)" }}>
                        <polygon points="204,212 216,212 210,78" fill="#0F172A" />
                        <circle cx="210" cy="210" r="11" fill="#0F172A" />
                        <circle cx="210" cy="210" r="4.5" fill="#fff" />
                      </g>
                      <text x="210" y="150" textAnchor="middle" fontSize="44" fontWeight="800" fill="#0F172A" style={{ fontFamily: "var(--font-display)" }}>top {effTop} %</text>
                      <text x="210" y="178" textAnchor="middle" fontSize="13" fontWeight="600" fill="#5B6479">vous gagnez plus que {effMoins} %</text>
                    </svg>
                  );
                })()}
              </div>
              <p className="text-center text-[12px] text-slate-soft">Position parmi les salariés français (0 % = plus bas, 100 % = plus haut). Repères en {unitOf(fmt).basis} {unitOf(fmt).per}. Source : INSEE {FR_YEAR}.</p>
            </div>
          </section>

          {/* ====== Distribution — avant / après (interactive) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[32px] border border-line bg-white/90 p-6 shadow-[0_40px_100px_-50px_rgba(5,9,24,.55)] backdrop-blur md:p-9">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><BarChart3 className="h-5 w-5" aria-hidden /></span>
                <h3 className="font-display text-[clamp(20px,2.8vw,28px)] font-extrabold tracking-[-0.015em] text-ink">Votre place dans la distribution des salaires</h3>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#00C389]" /> Salaire simulé</span>
                {Math.abs(simNet - baseNet) >= 20 && <span className="inline-flex items-center gap-1.5"><span className="h-0 w-3 border-t-2 border-dashed border-[#94A3B8]" /> Salaire actuel</span>}
                <span>· la zone violette = ceux qui gagnent moins que vous.</span>
              </p>
              <div className="cjv-drop mt-6 overflow-x-auto md:overflow-visible">
                {(() => {
                  const W = 820, H = 256, baseY = 188, peak = 150;
                  const lnMin = Math.log(1200), lnMax = Math.log(11000);
                  const mu = Math.log(MEDIAN_NET_MONTH), sigma = Math.log(TOP10_NET_MONTH / MEDIAN_NET_MONTH) / 1.2816;
                  const xP = (v: number) => ((Math.log(Math.min(11000, Math.max(1200, v))) - lnMin) / (lnMax - lnMin)) * W;
                  const dens = (lx: number) => Math.exp(-0.5 * ((lx - mu) / sigma) ** 2);
                  const N = 72; const pts: { x: number; y: number }[] = [];
                  for (let i = 0; i <= N; i++) { const lx = lnMin + (lnMax - lnMin) * (i / N); pts.push({ x: (i / N) * W, y: baseY - peak * dens(lx) }); }
                  const curve = "M" + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
                  const area = `M0 ${baseY} L ` + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + ` L ${W} ${baseY} Z`;
                  const sx = xP(effNet); const sy = baseY - peak * dens(Math.log(Math.min(11000, Math.max(1200, effNet))));
                  const bx = xP(baseNet);
                  const leftPts = pts.filter((p) => p.x <= sx); const rightPts = pts.filter((p) => p.x >= sx);
                  const leftArea = `M0 ${baseY} L ` + leftPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + ` L ${sx.toFixed(1)} ${sy.toFixed(1)} L ${sx.toFixed(1)} ${baseY} Z`;
                  const rightArea = `M${sx.toFixed(1)} ${baseY} L ${sx.toFixed(1)} ${sy.toFixed(1)} L ` + rightPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + ` L ${W} ${baseY} Z`;
                  const marks = [{ v: MEDIAN_NET_MONTH, l: "Médiane" }, { v: TOP10_NET_MONTH, l: "Top 10 %" }, { v: TOP1_NET_MONTH, l: "Top 1 %" }];
                  const lx2 = Math.max(46, Math.min(W - 46, sx * 0.5)); const rx2 = Math.max(46, Math.min(W - 46, (sx + W) / 2));
                  const showBase = Math.abs(sx - bx) > 8;
                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[560px] md:min-w-0" preserveAspectRatio="xMidYMid meet">
                      <style>{`.tfz{transition:opacity .15s ease}.tfz:hover{opacity:.85}`}</style>
                      <defs>
                        <linearGradient id="tfFull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6E9F2" stopOpacity="0.7" /><stop offset="1" stopColor="#E6E9F2" stopOpacity="0.1" /></linearGradient>
                        <linearGradient id="tfLeft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C3AED" stopOpacity="0.55" /><stop offset="1" stopColor="#7C3AED" stopOpacity="0.08" /></linearGradient>
                      </defs>
                      <path d={area} fill="url(#tfFull)" />
                      <path className="tfz" d={rightArea} fill="#CBD5E1" fillOpacity="0.28"><title>{`${100 - effMoins} % gagnent plus que vous`}</title></path>
                      <path className="tfz" d={leftArea} fill="url(#tfLeft)"><title>{`${effMoins} % gagnent moins que vous`}</title></path>
                      <path d={curve} fill="none" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="#E6E9F2" strokeWidth="1" />
                      <text x={lx2} y={baseY - 96} textAnchor="middle" fontSize="15" fontWeight="800" fill="#6D28D9">{effMoins} %</text>
                      <text x={lx2} y={baseY - 80} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#8A93A8">gagnent moins</text>
                      <text x={rx2} y={baseY - 96} textAnchor="middle" fontSize="14" fontWeight="700" fill="#94A3B8">{100 - effMoins} %</text>
                      <text x={rx2} y={baseY - 80} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#94A3B8">gagnent plus</text>
                      {marks.map((m) => { const x = xP(m.v); return (
                        <g key={m.l}>
                          <line x1={x} y1={baseY} x2={x} y2={baseY - peak * dens(Math.log(m.v)) - 6} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
                          <text x={x} y={baseY + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#8A93A8">{m.l}</text>
                        </g>
                      ); })}
                      {showBase && (<g>
                        <line x1={bx} y1={baseY} x2={bx} y2={baseY - 150} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />
                        <rect x={Math.min(W - 60, Math.max(0, bx - 30))} y={baseY - 168} width="60" height="20" rx="6" fill="#fff" stroke="#CBD5E1" />
                        <text x={Math.min(W - 30, Math.max(30, bx))} y={baseY - 154} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#64748B">actuel</text>
                      </g>)}
                      <line x1={sx} y1={sy - 4} x2={sx} y2={baseY} stroke="#00A06E" strokeWidth="2.5" />
                      <circle cx={sx} cy={sy} r="7" fill="#00C389" stroke="#fff" strokeWidth="3" />
                      <rect x={Math.min(W - 88, Math.max(0, sx - 44))} y={Math.max(2, sy - 38)} width="88" height="24" rx="8" fill="#00C389" />
                      <text x={Math.min(W - 44, Math.max(44, sx))} y={Math.max(18, sy - 22)} textAnchor="middle" fontSize="12" fontWeight="800" fill="#0F172A">{showBase ? "simulé" : "Vous"}</text>
                    </svg>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* ====== Ce qu'il vous manque (cartes interactives) ====== */}
          {(() => {
            const refs = [{ l: "le salaire médian", verb: "dépasser", v: MEDIAN_NET_MONTH }, { l: "le salaire moyen", verb: "dépasser", v: MEAN_NET_MONTH }, { l: "le top 10 %", verb: "entrer dans", v: TOP10_NET_MONTH }, { l: "le top 5 %", verb: "entrer dans", v: TOP5_NET_MONTH_EST }, { l: "le top 1 %", verb: "entrer dans", v: TOP1_NET_MONTH }];
            const next = refs.filter((r) => r.v > effNet).sort((a, b) => a.v - b.v).slice(0, 3);
            const passedMedian = effNet >= MEDIAN_NET_MONTH;
            return (
              <section className="rounded-[32px] border border-[#D9CFFA] bg-gradient-to-br from-[#F4EFFE] via-[#F8F5FF] to-white p-6 shadow-[0_40px_100px_-50px_rgba(124,58,237,.3)] md:p-9">
                <div className="flex items-center gap-2.5"><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#6D28D9] shadow-[0_6px_16px_-8px_rgba(124,58,237,.6)]"><ArrowUpRight className="h-5 w-5" aria-hidden /></span><h3 className="font-display text-[clamp(20px,2.8vw,27px)] font-extrabold tracking-[-0.015em] text-ink">Ce qu’il vous manque pour passer au-dessus</h3></div>
                {passedMedian && <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#E1F7EF] px-3 py-1 text-[13px] font-semibold text-[#0A8F60]">✓ Déjà au-dessus du salaire médian</p>}
                {!next.length ? (
                  <p className="mt-4 text-[16px] font-semibold text-ink">Vous êtes au sommet de la distribution des salaires français. 🎉</p>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {next.map((r) => { const pctTo = Math.min(100, Math.round((effNet / r.v) * 100)); return (
                      <div key={r.l} className="group rounded-2xl border border-[#E3DAFB] bg-white/85 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(124,58,237,.5)]">
                        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6D28D9]">{r.l.replace("le ", "")}</span>
                        <span className="mt-1 block font-display text-[20px] font-extrabold text-ink">{showDelta(r.v - effNet, fmt)}</span>
                        <span className="text-[13px] font-medium text-slate">pour {r.verb} {r.l}</span>
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EEE7FD]"><div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-500" style={{ width: `${pctTo}%` }} /></div>
                      </div>
                    ); })}
                  </div>
                )}
              </section>
            );
          })()}

          {/* ====== Objectif de classement ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-line bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-8">
              <div className="flex items-center gap-2.5"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><Crown className="h-5 w-5" aria-hidden /></span><h3 className="font-display text-[clamp(20px,2.6vw,26px)] font-extrabold tracking-[-0.015em] text-ink">Objectif de classement</h3></div>
              <p className="mt-2 text-[13.5px] font-semibold text-slate">Je veux atteindre :</p>
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {[50, 20, 10, 5, 1].map((tp) => (
                  <button key={tp} type="button" onClick={() => setTarget(tp)}
                    className={`rounded-xl border px-2 py-2.5 text-center text-[13px] font-bold transition ${target === tp ? "border-[#7C3AED] bg-[#7C3AED] text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,.8)]" : "border-line bg-white text-slate hover:border-[#C9B8F0] hover:text-ink"}`}>
                    Top {tp} %
                  </button>
                ))}
              </div>
              <div key={target} className="cjv-drop mt-5 overflow-hidden rounded-2xl border border-[#E3DAFB] bg-gradient-to-br from-[#F7F4FE] to-white p-5">
                {targetDelta > 0 ? (
                  <>
                    <p className="font-display text-[clamp(18px,2.6vw,24px)] font-bold leading-[1.25] text-ink">Pour atteindre le <span className="text-[#6D28D9]">top {target} %</span>, il vous faudrait <span className="text-[#6D28D9]">{showRef(targetRow.netMonth, fmt)}</span>{targetRow.estimate ? " (estimé)" : ""}.</p>
                    <p className="mt-1.5 text-[14.5px] font-semibold text-slate">Il vous manque <b className="text-[#C0264A]">{showDelta(targetDelta, fmt)}</b> — soit environ {targetPctDiff} % de plus.</p>
                    {/* connexion visuelle : vous -> objectif */}
                    <div className="relative mt-4 h-[10px] w-full rounded-full" style={{ background: "linear-gradient(90deg,#00C389,#2F6BFF 46%,#7C3AED 74%,#FF4D67)" }}>
                      <span className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#00C389] shadow" style={{ left: `${Math.min(99, basePct)}%` }} title="Vous" />
                      <span className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#7C3AED] shadow" style={{ left: `${100 - target}%` }} title={`Top ${target} %`} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-slate-soft"><span className="text-[#0A8F60]">Vous</span><span className="text-[#6D28D9]">Objectif top {target} %</span></div>
                  </>
                ) : (
                  <p className="font-display text-[clamp(18px,2.6vw,24px)] font-bold leading-[1.25] text-ink">Vous êtes déjà dans le <span className="text-[#0A8F60]">top {target} %</span> 🎉<span className="mt-1 block text-[14.5px] font-semibold text-slate">Seuil : {showRef(targetRow.netMonth, fmt)}{targetRow.estimate ? " (estimé)" : ""}.</span></p>
                )}
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
