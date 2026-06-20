"use client";

import { useMemo, useState } from "react";
import { Trophy, Sparkles, Target, BarChart3, Compass, ArrowUpRight, Crown } from "lucide-react";
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

// Conversions — toutes les valeurs internes sont en NET MENSUEL.
const toNetMonth = (val: number, fmt: Fmt) =>
  fmt === "net_month" ? val : fmt === "net_year" ? val / 12 : fmt === "brut_month" ? val * 0.78 : (val * 0.78) / 12;
const fromNetMonth = (nm: number, fmt: Fmt) =>
  fmt === "net_month" ? nm : fmt === "net_year" ? nm * 12 : fmt === "brut_month" ? nm * NET2GROSS : nm * 12 * NET2GROSS;
const unitOf = (fmt: Fmt) =>
  fmt === "net_month" ? { basis: "net", per: "/ mois" } : fmt === "net_year" ? { basis: "net", per: "/ an" } : fmt === "brut_month" ? { basis: "brut", per: "/ mois" } : { basis: "brut", per: "/ an" };
const showRef = (nm: number, fmt: Fmt) => { const u = unitOf(fmt); return `${euro(fromNetMonth(nm, fmt))} ${u.basis} ${u.per}`; };
const showDelta = (deltaNm: number, fmt: Fmt) => { const u = unitOf(fmt); return `${euro(fromNetMonth(Math.abs(deltaNm), fmt))} ${u.basis} ${u.per}`; };

const REF_COLOR: Record<string, string> = { smic: "#64748B", median: "#475569", mean: "#2F6BFF", top10: "#7C3AED", top5: "#A855F7", top1: "#FF4D67" };

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
  const [shownNet, setShownNet] = useState(0);
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [boost, setBoost] = useState(0); // simulateur : +€ net / mois (plage large)
  const [target, setTarget] = useState(10); // objectif de classement (top X %)

  const amountValue = parseAmount(amount);
  const valid = Number.isFinite(amountValue) && amountValue > 0;
  const liveNet = valid ? toNetMonth(amountValue, fmt) : 0;
  const run = () => { if (!valid) return; setShownNet(liveNet); setBoost(0); setStatus("done"); };

  const baseNet = shownNet;
  const effNet = Math.max(0, baseNet + boost);
  const basePct = useMemo(() => percentileOfNetMonthly(baseNet), [baseNet]);
  const effPct = useMemo(() => percentileOfNetMonthly(effNet), [effNet]);
  const baseTop = Math.max(1, Math.round(100 - basePct));
  const effTop = Math.max(1, Math.round(100 - effPct));
  const baseMoins = Math.min(99, Math.round(basePct));
  const effMoins = Math.min(99, Math.round(effPct));

  const posPhrase = baseNet >= TOP1_NET_MONTH ? "Vous faites partie du top 1 % des salaires français."
    : baseNet >= TOP10_NET_MONTH ? "Vous faites partie des 10 % les mieux payés en France."
    : baseNet >= MEAN_NET_MONTH ? "Vous êtes au-dessus du salaire moyen, mais encore sous le top 10 %."
    : baseNet >= MEDIAN_NET_MONTH ? "Vous êtes au-dessus du salaire médian, mais sous le salaire moyen."
    : baseNet >= SMIC_NET_MONTH ? "Vous êtes entre le SMIC et le salaire médian." : "Vous êtes autour du niveau du SMIC.";

  // bulles d'écart (suivent le simulateur)
  const bubbles = [
    { key: "median", label: "Médiane", v: MEDIAN_NET_MONTH },
    { key: "top10", label: "Top 10 %", v: TOP10_NET_MONTH },
    { key: "top1", label: "Top 1 %", v: TOP1_NET_MONTH },
  ].map((b) => ({ ...b, d: b.v - effNet }));

  // objectif de classement
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
        <div key={shownNet} className="cjv-drop mt-8 space-y-7 scroll-mt-20">
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

          {/* ====== Simulateur d'augmentation (plage large, sans presets) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-line bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-8">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEE7FD] text-[#6D28D9]"><Sparkles className="h-5 w-5" aria-hidden /></span>
                <h3 className="font-display text-[clamp(20px,2.6vw,26px)] font-extrabold tracking-[-0.015em] text-ink">Et si votre salaire augmentait ?</h3>
              </div>
              <p className="mt-3 text-balance font-display text-[clamp(18px,2.6vw,26px)] font-bold leading-[1.2] text-ink">
                {boost > 0 ? (<>Avec <span className="text-[#6D28D9]">+{euro(boost)} net / mois</span>, vous passeriez du top {baseTop} % au <span className="text-[#0A8F60]">top {effTop} %</span>.</>)
                  : (<>Faites glisser le curseur et voyez votre progression dans le classement français.</>)}
              </p>
              {boost > 0 && <p className="mt-1 text-[13.5px] font-semibold text-slate">Soit un salaire de {showRef(effNet, fmt)} — vous dépasseriez alors {effMoins} % des salariés.{baseTop - effTop > 0 ? ` (+${baseTop - effTop} points)` : ""}</p>}
              <input type="range" min={0} max={10000} step={50} value={boost} onChange={(e) => setBoost(Number(e.target.value))}
                className="mt-5 w-full accent-[#7C3AED]" aria-label="Augmentation nette par mois" />
              <div className="mt-1 flex justify-between text-[11.5px] font-medium text-slate-soft"><span>+0 €</span><span>{euro(boost)} / mois</span><span>+10 000 €</span></div>
            </div>
          </section>
          {/* ====== Vous êtes ici — jauge percentile (identité propre) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[32px] border border-line bg-gradient-to-b from-white to-[#FBFCFF] p-6 shadow-[0_40px_100px_-50px_rgba(5,9,24,.55)] backdrop-blur md:p-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><Target className="h-5 w-5" aria-hidden /></span>
                  <h3 className="font-display text-[clamp(20px,2.8vw,28px)] font-extrabold tracking-[-0.015em] text-ink">Vous êtes ici</h3>
                </div>
                <span className="rounded-full bg-[#EEE7FD] px-3 py-1 text-[12.5px] font-bold text-[#6D28D9]">top {effTop} %</span>
              </div>
              <p className="mt-2 text-[13.5px] text-slate">Votre place parmi les salariés français · repères en <b className="font-semibold text-ink">{unitOf(fmt).basis} {unitOf(fmt).per}</b>.</p>

              <div className="mt-28 overflow-x-auto pb-2 md:mt-32 md:overflow-x-visible">
                <div className="relative mx-auto min-w-[560px] md:min-w-0">
                  {(() => {
                    const refs = GAUGE_REFS.map((r) => ({ ...r, left: percentileOfNetMonthly(r.netMonth), color: REF_COLOR[r.key] }));
                    const GAP = 8; const lvl: number[] = [];
                    refs.forEach((it, i) => { const used = new Set<number>(); for (let j = 0; j < i; j++) if (Math.abs(it.left - refs[j].left) < GAP) used.add(lvl[j]); let k = 0; while (used.has(k)) k++; lvl[i] = k; });
                    return refs.map((r, i) => {
                      const tier = lvl[i]; const h = 34 + tier * 24; const shown = tier < 3;
                      const edge = r.left < 12 ? "l" : r.left > 88 ? "r" : "c";
                      const tipPos = edge === "l" ? "left-0" : edge === "r" ? "right-0" : "left-1/2 -translate-x-1/2";
                      return (
                        <div key={r.key} className="group absolute bottom-1/2 z-20 -translate-x-1/2 hover:z-[80]" style={{ left: `${r.left}%` }}>
                          {shown && <span aria-hidden className="absolute left-1/2 w-px -translate-x-1/2" style={{ backgroundColor: r.color, opacity: 0.45, bottom: "10px", height: `${h - 12}px` }} />}
                          {shown && <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11.5px] font-bold" style={{ bottom: `${h}px`, color: r.color, borderColor: `${r.color}44`, background: `${r.color}10` }}>{r.label}</span>}
                          <span className="absolute bottom-0 left-1/2 h-[14px] w-[14px] -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white" style={{ backgroundColor: r.color, boxShadow: `0 0 0 3px ${r.color}30,0 2px 8px rgba(15,23,42,.35)` }} />
                          <span className={`pointer-events-none absolute bottom-[calc(100%+2px)] z-[90] w-max max-w-[220px] rounded-xl bg-ink px-3.5 py-2.5 text-left opacity-0 shadow-[0_16px_36px_-10px_rgba(0,0,0,.6)] transition group-hover:opacity-100 ${tipPos}`}>
                            <span className="block text-[13px] font-extrabold text-white">{r.label}</span>
                            <span className="mt-0.5 block text-[12.5px] font-bold text-white">{showRef(r.netMonth, fmt)}{r.estimate ? " · estimation" : ""}</span>
                          </span>
                        </div>
                      );
                    });
                  })()}

                  <div className="h-[30px] w-full rounded-full shadow-[inset_0_2px_5px_rgba(0,0,0,.16)]" style={{ background: "linear-gradient(90deg,#00C389,#2F6BFF 46%,#7C3AED 74%,#FF4D67)" }} />

                  <div className="absolute top-1/2 z-[60] -translate-x-1/2 -translate-y-1/2 transition-all duration-500" style={{ left: `${effPct}%` }}>
                    <span className="relative flex h-[30px] w-[30px] items-center justify-center">
                      <span aria-hidden className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-50" />
                      <span className="relative h-[30px] w-[30px] rounded-full border-[3px] border-white bg-brand shadow-[0_2px_12px_rgba(0,195,137,.85)]" />
                    </span>
                  </div>
                  <div className="absolute z-[60] -translate-x-1/2 transition-all duration-500" style={{ left: `${effPct}%`, top: "calc(50% + 28px)" }}>
                    <span className="whitespace-nowrap rounded-lg bg-brand px-3.5 py-1.5 text-[13px] font-extrabold text-ink shadow-[0_8px_22px_-6px_rgba(0,195,137,.95)]">Vous · top {effTop} %</span>
                  </div>
                </div>

                <div className="relative mx-auto mt-[80px] min-w-[560px] md:min-w-0">
                  <div className="h-px w-full bg-line" />
                  {[0, 25, 50, 75, 100].map((t) => (
                    <div key={t} className="absolute -translate-x-1/2 text-center" style={{ left: `${t}%`, top: "-4px" }}>
                      <span className="mx-auto block h-2 w-px bg-line" />
                      <span className="mt-1 block text-[11px] font-semibold text-slate-soft">{t} %</span>
                    </div>
                  ))}
                </div>
                <p className="mt-7 text-center text-[11.5px] text-slate-soft">Part des salariés français (0 % = les plus bas salaires, 100 % = les plus hauts). Source : INSEE {FR_YEAR}.</p>
              </div>
            </div>
          </section>

          {/* ====== Courbe de distribution (interactive) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[32px] border border-line bg-white/90 p-6 shadow-[0_40px_100px_-50px_rgba(5,9,24,.55)] backdrop-blur md:p-9">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><BarChart3 className="h-5 w-5" aria-hidden /></span>
                <h3 className="font-display text-[clamp(20px,2.8vw,28px)] font-extrabold tracking-[-0.015em] text-ink">Votre place dans la distribution des salaires</h3>
              </div>
              <p className="mt-2 text-[13.5px] text-slate">La zone violette représente les salariés qui gagnent <b className="font-semibold text-ink">moins que vous</b>. Faites glisser le simulateur ci-dessus pour déplacer votre position.</p>
              <div key={effNet} className="cjv-drop mt-6 overflow-x-auto md:overflow-visible">
                {(() => {
                  const W = 820, H = 250, baseY = 188, peak = 150;
                  const lnMin = Math.log(1200), lnMax = Math.log(11000);
                  const mu = Math.log(MEDIAN_NET_MONTH), sigma = Math.log(TOP10_NET_MONTH / MEDIAN_NET_MONTH) / 1.2816;
                  const xP = (v: number) => ((Math.log(Math.min(11000, Math.max(1200, v))) - lnMin) / (lnMax - lnMin)) * W;
                  const dens = (lx: number) => Math.exp(-0.5 * ((lx - mu) / sigma) ** 2);
                  const N = 72; const pts: { x: number; y: number }[] = [];
                  for (let i = 0; i <= N; i++) { const lx = lnMin + (lnMax - lnMin) * (i / N); pts.push({ x: (i / N) * W, y: baseY - peak * dens(lx) }); }
                  const curve = "M" + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
                  const area = `M0 ${baseY} L ` + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + ` L ${W} ${baseY} Z`;
                  const ux = xP(effNet); const uy = baseY - peak * dens(Math.log(Math.min(11000, Math.max(1200, effNet))));
                  const leftPts = pts.filter((p) => p.x <= ux);
                  const rightPts = pts.filter((p) => p.x >= ux);
                  const leftArea = `M0 ${baseY} L ` + leftPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + ` L ${ux.toFixed(1)} ${uy.toFixed(1)} L ${ux.toFixed(1)} ${baseY} Z`;
                  const rightArea = `M${ux.toFixed(1)} ${baseY} L ${ux.toFixed(1)} ${uy.toFixed(1)} L ` + rightPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + ` L ${W} ${baseY} Z`;
                  const marks = [{ v: MEDIAN_NET_MONTH, l: "Médiane" }, { v: TOP10_NET_MONTH, l: "Top 10 %" }, { v: TOP1_NET_MONTH, l: "Top 1 %" }];
                  const lx2 = Math.max(46, Math.min(W - 46, ux * 0.5)); const rx2 = Math.max(46, Math.min(W - 46, (ux + W) / 2));
                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[560px] md:min-w-0" preserveAspectRatio="xMidYMid meet">
                      <style>{`.tfz{transition:opacity .15s ease}.tfz:hover{opacity:.85}`}</style>
                      <defs>
                        <linearGradient id="tfFull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6E9F2" stopOpacity="0.7" /><stop offset="1" stopColor="#E6E9F2" stopOpacity="0.1" /></linearGradient>
                        <linearGradient id="tfLeft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C3AED" stopOpacity="0.55" /><stop offset="1" stopColor="#7C3AED" stopOpacity="0.08" /></linearGradient>
                      </defs>
                      <path d={area} fill="url(#tfFull)" />
                      <path className="tfz" d={rightArea} fill="#CBD5E1" fillOpacity="0.28"><title>{`${100 - effMoins} % des salariés gagnent plus que vous`}</title></path>
                      <path className="tfz" d={leftArea} fill="url(#tfLeft)"><title>{`${effMoins} % des salariés gagnent moins que vous`}</title></path>
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
                      <line x1={ux} y1={uy - 4} x2={ux} y2={baseY} stroke="#00A06E" strokeWidth="2.5" />
                      <circle cx={ux} cy={uy} r="7" fill="#00C389" stroke="#fff" strokeWidth="3" />
                      <rect x={Math.min(W - 78, Math.max(0, ux - 39))} y={Math.max(2, uy - 38)} width="78" height="24" rx="8" fill="#00C389" />
                      <text x={Math.min(W - 39, Math.max(39, ux))} y={Math.max(18, uy - 22)} textAnchor="middle" fontSize="12" fontWeight="800" fill="#0F172A">Vous</text>
                    </svg>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* ====== Ce qu'il vous manque (renforcé) ====== */}
          {(() => {
            const refs = [{ l: "le salaire médian", v: MEDIAN_NET_MONTH }, { l: "le salaire moyen", v: MEAN_NET_MONTH }, { l: "le top 10 %", v: TOP10_NET_MONTH }, { l: "le top 5 %", v: TOP5_NET_MONTH_EST }, { l: "le top 1 %", v: TOP1_NET_MONTH }];
            const next = refs.filter((r) => r.v > effNet).sort((a, b) => a.v - b.v).slice(0, 3);
            const passedMedian = effNet >= MEDIAN_NET_MONTH;
            return (
              <section className="rounded-[28px] border border-[#D9CFFA] bg-gradient-to-br from-[#F4EFFE] via-[#F8F5FF] to-white p-6 md:p-8">
                <div className="flex items-center gap-2.5"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-[#6D28D9]"><ArrowUpRight className="h-5 w-5" aria-hidden /></span><h3 className="font-display text-[clamp(19px,2.6vw,26px)] font-extrabold tracking-[-0.015em] text-ink">Ce qu’il vous manque pour passer au-dessus</h3></div>
                {!next.length ? (
                  <p className="mt-4 text-[16px] font-semibold text-ink">Vous êtes au sommet de la distribution des salaires français. 🎉</p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {passedMedian && <p className="text-[14.5px] font-semibold text-[#0A8F60]">✓ Vous êtes déjà au-dessus du salaire médian.</p>}
                    {next.map((r) => { const pctTo = Math.min(100, Math.round((effNet / r.v) * 100)); return (
                      <div key={r.l} className="rounded-2xl border border-[#E3DAFB] bg-white/80 p-4">
                        <p className="text-[15.5px] font-semibold text-ink">Il vous manque <b className="font-extrabold text-[#6D28D9]">{showDelta(r.v - effNet, fmt)}</b> pour entrer dans {r.l}.</p>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EEE7FD]"><div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-500" style={{ width: `${pctTo}%` }} /></div>
                      </div>
                    ); })}
                  </div>
                )}
              </section>
            );
          })()}

          {/* ====== Objectif de classement (nouvel outil) ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-line bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-8">
              <div className="flex items-center gap-2.5"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><Crown className="h-5 w-5" aria-hidden /></span><h3 className="font-display text-[clamp(20px,2.6vw,26px)] font-extrabold tracking-[-0.015em] text-ink">Objectif de classement</h3></div>
              <p className="mt-2 text-[13.5px] font-semibold text-slate">Je veux atteindre :</p>
              <div className="mt-3">
                <Seg<string> value={String(target)} onChange={(v) => setTarget(Number(v))} size="sm" options={[{ v: "50", label: "Top 50 %" }, { v: "20", label: "Top 20 %" }, { v: "10", label: "Top 10 %" }, { v: "5", label: "Top 5 %" }, { v: "1", label: "Top 1 %" }]} />
              </div>
              <div className="mt-5 rounded-2xl border border-line bg-surface/60 p-5">
                {targetDelta > 0 ? (
                  <>
                    <p className="font-display text-[clamp(18px,2.6vw,24px)] font-bold leading-[1.25] text-ink">Pour atteindre le <span className="text-[#6D28D9]">top {target} %</span>, il vous faudrait environ {showRef(targetRow.netMonth, fmt)}{targetRow.estimate ? " (estimé)" : ""}.</p>
                    <p className="mt-1.5 text-[14.5px] font-semibold text-slate">Il vous manque environ <b className="text-[#C0264A]">{showDelta(targetDelta, fmt)}</b> — soit {targetPctDiff} % de plus.</p>
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
