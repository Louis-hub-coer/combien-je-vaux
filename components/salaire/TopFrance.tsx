"use client";

import { useMemo, useState } from "react";
import { Trophy, Sparkles, Target, TrendingUp, BarChart3, Compass } from "lucide-react";
import {
  NET2GROSS, FR_YEAR, GAUGE_REFS, TOP_THRESHOLDS,
  percentileOfNetMonthly,
  MEDIAN_NET_MONTH, MEAN_NET_MONTH, TOP10_NET_MONTH, TOP1_NET_MONTH, TOP5_NET_MONTH_EST, SMIC_NET_MONTH,
} from "@/lib/salary/france-distribution";

type Fmt = "net_month" | "net_year" | "brut_year";

const NBSP = "\u00A0";
const FMT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euro = (n: number) => FMT.format(Math.round(n)).replace(/\u202F/g, NBSP) + NBSP + "€";
const parseAmount = (s: string) => { const n = parseFloat((s || "").replace(/\s/g, "").replace(",", ".")); return Number.isFinite(n) ? n : NaN; };

// Conversions — toutes les valeurs internes sont en NET MENSUEL.
const toNetMonth = (val: number, fmt: Fmt) => fmt === "net_month" ? val : fmt === "net_year" ? val / 12 : (val * 0.78) / 12;
const fromNetMonth = (netMonth: number, fmt: Fmt) => fmt === "net_month" ? netMonth : fmt === "net_year" ? netMonth * 12 : netMonth * 12 * NET2GROSS;
const unitOf = (fmt: Fmt) => fmt === "net_month" ? { basis: "net", per: "/ mois" } : fmt === "net_year" ? { basis: "net", per: "/ an" } : { basis: "brut", per: "/ an" };
const showRef = (netMonth: number, fmt: Fmt) => { const u = unitOf(fmt); return `${euro(fromNetMonth(netMonth, fmt))} ${u.basis} ${u.per}`; };
const showDelta = (deltaNetMonth: number, fmt: Fmt) => { const u = unitOf(fmt); return `${euro(fromNetMonth(Math.abs(deltaNetMonth), fmt))} ${u.basis} ${u.per}`; };

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
  const [shownNet, setShownNet] = useState(0); // net mensuel retenu
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [boost, setBoost] = useState(0); // simulateur : +€ net / mois

  const amountValue = parseAmount(amount);
  const valid = Number.isFinite(amountValue) && amountValue > 0;
  const liveNet = valid ? toNetMonth(amountValue, fmt) : 0;

  const run = () => { if (!valid) return; setShownNet(liveNet); setBoost(0); setStatus("done"); };

  // Calculs (base = salaire saisi ; eff = base + simulateur)
  const baseNet = shownNet;
  const effNet = Math.max(0, baseNet + boost);
  const basePct = useMemo(() => percentileOfNetMonthly(baseNet), [baseNet]);
  const effPct = useMemo(() => percentileOfNetMonthly(effNet), [effNet]);
  const baseTop = Math.max(1, Math.round(100 - basePct));
  const effTop = Math.max(1, Math.round(100 - effPct));
  const baseMoins = Math.min(99, Math.round(basePct));

  const dMedian = MEDIAN_NET_MONTH - baseNet;
  const dTop10 = TOP10_NET_MONTH - baseNet;
  const dTop1 = TOP1_NET_MONTH - baseNet;

  // position courte
  const posPhrase = baseNet >= TOP1_NET_MONTH ? "Vous faites partie du top 1 % des salaires français."
    : baseNet >= TOP10_NET_MONTH ? "Vous faites partie des 10 % les mieux payés en France."
    : baseNet >= MEAN_NET_MONTH ? "Vous êtes au-dessus du salaire moyen, mais encore sous le top 10 %."
    : baseNet >= MEDIAN_NET_MONTH ? "Vous êtes au-dessus du salaire médian, mais sous le salaire moyen."
    : baseNet >= SMIC_NET_MONTH ? "Vous êtes entre le SMIC et le salaire médian." : "Vous êtes autour du niveau du SMIC.";

  return (
    <div className="mx-auto max-w-[1040px]">
      {/* ---------- Carte formulaire ---------- */}
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
              <Seg<Fmt> value={fmt} onChange={setFmt} options={[{ v: "net_month", label: "Net / mois" }, { v: "net_year", label: "Net / an" }, { v: "brut_year", label: "Brut / an" }]} />
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
          {/* ====== Résultat principal ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-[#D9CFFA] bg-gradient-to-br from-[#F4EFFE] via-[#F8F5FF] to-white p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] md:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D9CFFA] bg-white/70 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#6D28D9]"><Trophy className="h-3.5 w-3.5" /> Votre position en France</span>
              <p className="mt-4 max-w-[720px] text-balance font-display text-[clamp(24px,4vw,38px)] font-bold leading-[1.16] tracking-[-0.015em] text-ink">
                Vous gagnez plus que <span className="text-[#6D28D9]">{baseMoins} %</span> des salariés français.
              </p>
              <p className="mt-2 text-[15px] font-semibold text-slate">Votre salaire vous place dans le <b className="text-ink">top {baseTop} %</b> des salaires en France. {posPhrase}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[{ l: "Écart avec la médiane", d: dMedian }, { l: "Écart avec le top 10 %", d: dTop10 }, { l: "Écart avec le top 1 %", d: dTop1 }].map((it) => (
                  <div key={it.l} className="rounded-2xl border border-line bg-white/80 p-3.5">
                    <span className="block text-[11.5px] font-semibold text-slate-soft">{it.l}</span>
                    <span className={`mt-0.5 block text-[16px] font-extrabold ${it.d > 0 ? "text-[#C0264A]" : "text-[#0A8F60]"}`}>{it.d > 0 ? "−" : "+"}{showDelta(it.d, fmt)}</span>
                    <span className="text-[11.5px] text-slate-soft">{it.d > 0 ? "à rattraper" : "au-dessus"}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ====== Grande jauge "Vous êtes ici" ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[32px] border border-line bg-white/90 p-6 shadow-[0_40px_100px_-50px_rgba(5,9,24,.55)] backdrop-blur md:p-9">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><Target className="h-5 w-5" aria-hidden /></span>
                <h3 className="font-display text-[clamp(20px,2.8vw,28px)] font-extrabold tracking-[-0.015em] text-ink">Vous êtes ici</h3>
              </div>
              <p className="mt-2 text-[13.5px] text-slate">Position sur la distribution française · tous les repères en <b className="font-semibold text-ink">{unitOf(fmt).basis} {unitOf(fmt).per}</b>. Survolez un repère pour le détail.</p>

              <div className="mt-24 overflow-x-auto pb-3 md:mt-28 md:overflow-x-visible">
                <div className="relative mx-auto mb-20 min-w-[560px] md:mb-24 md:min-w-0">
                  <div className="h-[40px] w-full rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,.16)]" style={{ background: "linear-gradient(90deg,#00C389,#2F6BFF 46%,#7C3AED 74%,#FF4D67)" }} />
                  {(() => {
                    const refs = GAUGE_REFS.map((r) => ({ ...r, left: percentileOfNetMonthly(r.netMonth) }));
                    const GAP = 8;
                    const levels: number[] = [];
                    refs.forEach((it, i) => {
                      const used = new Set<number>();
                      for (let j = 0; j < i; j++) if (Math.abs(it.left - refs[j].left) < GAP) used.add(levels[j]);
                      let lvl = 0; while (used.has(lvl)) lvl++; levels[i] = lvl;
                    });
                    return refs.map((r, idx) => {
                      const level = levels[idx]; const side = level % 2 === 0 ? "below" : "above"; const tier = Math.floor(level / 2);
                      const off = 30 + tier * 21; const hidden = tier >= 2;
                      const edge = r.left < 12 ? "l" : r.left > 88 ? "r" : "c";
                      const tipPos = edge === "l" ? "left-0" : edge === "r" ? "right-0" : "left-1/2 -translate-x-1/2";
                      const arrPos = edge === "l" ? "left-4" : edge === "r" ? "right-4" : "left-1/2 -translate-x-1/2";
                      return (
                        <div key={r.key} className="group absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 hover:z-[70]" style={{ left: `${r.left}%` }}>
                          {!hidden && tier > 0 && <span aria-hidden className="absolute left-1/2 w-px -translate-x-1/2 bg-line" style={side === "below" ? { top: "16px", height: `${off - 18}px` } : { bottom: "16px", height: `${off - 18}px` }} />}
                          <span className="block h-[16px] w-[16px] rounded-full border-2 border-white bg-ink/70 shadow-[0_2px_8px_rgba(15,23,42,.35)] transition group-hover:scale-[1.35]" />
                          {!hidden && (
                            <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[11.5px] font-semibold text-slate" style={side === "below" ? { top: `${off}px` } : { bottom: `${off}px` }}>{r.label}</span>
                          )}
                          <span className={`pointer-events-none absolute bottom-[40px] z-[90] w-max max-w-[230px] rounded-xl bg-ink px-3.5 py-2.5 text-left opacity-0 shadow-[0_16px_36px_-10px_rgba(0,0,0,.6)] transition duration-150 group-hover:opacity-100 ${tipPos}`}>
                            <span className="block text-[13px] font-extrabold text-white">{r.label}</span>
                            <span className="mt-0.5 block text-[12.5px] font-bold text-white">{showRef(r.netMonth, fmt)}</span>
                            <span className="block text-[11px] font-medium text-white/60">{r.estimate ? "estimation · " : ""}INSEE {r.key === "smic" ? "fin 2023" : FR_YEAR}</span>
                            <span aria-hidden className={`absolute top-full h-2.5 w-2.5 -translate-y-1.5 rotate-45 bg-ink ${arrPos}`} />
                          </span>
                        </div>
                      );
                    });
                  })()}
                  {/* marqueur Vous (suit le simulateur) */}
                  <div className="absolute -top-[74px] z-[60] flex -translate-x-1/2 flex-col items-center transition-all duration-500" style={{ left: `${effPct}%` }}>
                    <span className="whitespace-nowrap rounded-lg bg-brand px-3.5 py-1.5 text-[13px] font-extrabold text-ink shadow-[0_8px_22px_-6px_rgba(0,195,137,.95)]">Vous · top {effTop} %</span>
                    <span className="relative mt-1.5 flex h-[28px] w-[28px] items-center justify-center">
                      <span aria-hidden className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-50" />
                      <span className="relative h-[28px] w-[28px] rounded-full border-[3px] border-white bg-brand shadow-[0_2px_12px_rgba(0,195,137,.85)]" />
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-slate-soft">Repères : SMIC · médian · moyen · top 10 % · top 5 % · top 1 %. Source : INSEE {FR_YEAR} (privé, EQTP).</p>
            </div>
          </section>
          {/* ====== Courbe de distribution ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[32px] border border-line bg-white/90 p-6 shadow-[0_40px_100px_-50px_rgba(5,9,24,.55)] backdrop-blur md:p-9">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-brand-dark"><BarChart3 className="h-5 w-5" aria-hidden /></span>
                <h3 className="font-display text-[clamp(20px,2.8vw,28px)] font-extrabold tracking-[-0.015em] text-ink">Votre place dans la distribution des salaires</h3>
              </div>
              <p className="mt-2 text-[13.5px] text-slate">La zone colorée représente les salariés qui gagnent <b className="font-semibold text-ink">moins que vous</b>.</p>
              <div key={effNet} className="cjv-drop mt-6 overflow-x-auto md:overflow-visible">
                {(() => {
                  const W = 820, H = 250, baseY = 188, peak = 150;
                  const lnMin = Math.log(1200), lnMax = Math.log(11000);
                  const mu = Math.log(MEDIAN_NET_MONTH), sigma = Math.log(TOP10_NET_MONTH / MEDIAN_NET_MONTH) / 1.2816;
                  const xP = (v: number) => ((Math.log(Math.min(11000, Math.max(1200, v))) - lnMin) / (lnMax - lnMin)) * W;
                  const dens = (lx: number) => Math.exp(-0.5 * ((lx - mu) / sigma) ** 2);
                  const N = 72; const pts: { x: number; y: number; lx: number }[] = [];
                  for (let i = 0; i <= N; i++) { const lx = lnMin + (lnMax - lnMin) * (i / N); pts.push({ x: (i / N) * W, y: baseY - peak * dens(lx), lx }); }
                  const curve = "M" + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
                  const area = `M0 ${baseY} L ` + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + ` L ${W} ${baseY} Z`;
                  const ux = xP(effNet); const uy = baseY - peak * dens(Math.log(Math.min(11000, Math.max(1200, effNet))));
                  const leftPts = pts.filter((p) => p.x <= ux);
                  const leftArea = `M0 ${baseY} L ` + leftPts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ") + ` L ${ux.toFixed(1)} ${uy.toFixed(1)} L ${ux.toFixed(1)} ${baseY} Z`;
                  const marks = [{ v: MEDIAN_NET_MONTH, l: "Médiane" }, { v: TOP10_NET_MONTH, l: "Top 10 %" }, { v: TOP1_NET_MONTH, l: "Top 1 %" }];
                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[560px] md:min-w-0" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="tfFull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6E9F2" stopOpacity="0.7" /><stop offset="1" stopColor="#E6E9F2" stopOpacity="0.1" /></linearGradient>
                        <linearGradient id="tfLeft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C3AED" stopOpacity="0.55" /><stop offset="1" stopColor="#7C3AED" stopOpacity="0.08" /></linearGradient>
                      </defs>
                      <path d={area} fill="url(#tfFull)" />
                      <path d={leftArea} fill="url(#tfLeft)" />
                      <path d={curve} fill="none" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="#E6E9F2" strokeWidth="1" />
                      {marks.map((m) => { const x = xP(m.v); return (
                        <g key={m.l}>
                          <line x1={x} y1={baseY} x2={x} y2={baseY - peak * dens(Math.log(m.v)) - 6} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
                          <text x={x} y={baseY + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#8A93A8">{m.l}</text>
                        </g>
                      ); })}
                      {/* Vous */}
                      <line x1={ux} y1={uy - 4} x2={ux} y2={baseY} stroke="#00A06E" strokeWidth="2.5" />
                      <circle cx={ux} cy={uy} r="7" fill="#00C389" stroke="#fff" strokeWidth="3" />
                      <g>
                        <rect x={Math.min(W - 78, Math.max(0, ux - 39))} y={Math.max(2, uy - 38)} width="78" height="24" rx="8" fill="#00C389" />
                        <text x={Math.min(W - 39, Math.max(39, ux))} y={Math.max(18, uy - 22)} textAnchor="middle" fontSize="12" fontWeight="800" fill="#0F172A">Vous</text>
                      </g>
                    </svg>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* ====== Combien faut-il gagner pour... ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="rounded-[32px] border border-line bg-white/90 p-6 shadow-[0_40px_100px_-50px_rgba(5,9,24,.55)] backdrop-blur md:p-9">
              <h3 className="font-display text-[clamp(20px,2.8vw,28px)] font-extrabold tracking-[-0.015em] text-ink">Combien faut-il gagner pour atteindre chaque seuil ?</h3>
              <p className="mt-2 text-[13.5px] text-slate">Seuils en <b className="font-semibold text-ink">{unitOf(fmt).basis} {unitOf(fmt).per}</b> (France entière, INSEE {FR_YEAR}).</p>
              <div className="mt-5 space-y-2.5">
                {TOP_THRESHOLDS.map((t) => {
                  const above = baseNet >= t.netMonth; const d = t.netMonth - baseNet;
                  const w = Math.max(6, Math.min(100, (t.netMonth / TOP1_NET_MONTH) * 100));
                  return (
                    <div key={t.topPct} className="rounded-2xl border border-line bg-white/80 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <span className="flex items-center gap-2 text-[14px] font-extrabold text-ink">Top {t.topPct} %{t.estimate && <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-slate-soft">estimé</span>}</span>
                        <span className="text-[13.5px] font-bold text-slate">{showRef(t.netMonth, fmt)}</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full" style={{ width: `${w}%`, background: "linear-gradient(90deg,#00C389,#7C3AED)" }} /></div>
                      <p className={`mt-2 text-[12.5px] font-semibold ${above ? "text-[#0A8F60]" : "text-slate"}`}>{above ? "Vous êtes déjà au-dessus de ce seuil." : `Il vous manque ${showDelta(d, fmt)} pour y entrer.`}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ====== Ce qu'il vous manque ====== */}
          {(() => {
            const refs = [{ l: "le salaire médian", v: MEDIAN_NET_MONTH }, { l: "le salaire moyen", v: MEAN_NET_MONTH }, { l: "le top 10 %", v: TOP10_NET_MONTH }, { l: "le top 5 %", v: TOP5_NET_MONTH_EST }, { l: "le top 1 %", v: TOP1_NET_MONTH }];
            const next = refs.filter((r) => r.v > baseNet).sort((a, b) => a.v - b.v).slice(0, 3);
            if (!next.length) return (
              <section className="rounded-[24px] border border-[#D9CFFA] bg-gradient-to-br from-[#F4EFFE] to-white p-6"><p className="font-display text-[18px] font-bold text-ink">Vous êtes au sommet de la distribution des salaires français. 🎉</p></section>
            );
            return (
              <section className="rounded-[24px] border border-[#D9CFFA] bg-gradient-to-br from-[#F4EFFE] to-white p-6 md:p-7">
                <h3 className="font-display text-[clamp(18px,2.4vw,24px)] font-extrabold text-ink">Ce qu’il vous manque pour passer au-dessus</h3>
                <ul className="mt-4 space-y-2.5">
                  {next.map((r) => (
                    <li key={r.l} className="flex items-start gap-2.5 text-[15px] text-ink"><TrendingUp className="mt-1 h-4 w-4 shrink-0 text-[#6D28D9]" aria-hidden /><span>Il vous manque <b className="font-extrabold text-[#6D28D9]">{showDelta(r.v - baseNet, fmt)}</b> pour dépasser {r.l}.</span></li>
                  ))}
                </ul>
              </section>
            );
          })()}

          {/* ====== Simulateur d'augmentation ====== */}
          <section className="cjv-toolwrap">
            <div aria-hidden className="cjv-toolhalo" />
            <div className="cjv-toolcard overflow-hidden rounded-[28px] border border-line bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(5,9,24,.5)] backdrop-blur md:p-8">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EEE7FD] text-[#6D28D9]"><Sparkles className="h-5 w-5" aria-hidden /></span>
                <h3 className="font-display text-[clamp(20px,2.6vw,26px)] font-extrabold tracking-[-0.015em] text-ink">Et si votre salaire augmentait ?</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[100, 300, 500, 1000].map((b) => (
                  <button key={b} type="button" onClick={() => setBoost(b)} className={`rounded-xl border px-3 py-1.5 text-[13px] font-semibold transition ${boost === b ? "border-[#b79df0] bg-[#F4EFFE] text-[#6D28D9]" : "border-line bg-white text-slate hover:text-ink"}`}>+{b} € / mois</button>
                ))}
                {boost > 0 && <button type="button" onClick={() => setBoost(0)} className="rounded-xl border border-line bg-white px-3 py-1.5 text-[13px] font-semibold text-slate transition hover:text-ink">Réinitialiser</button>}
              </div>
              <input type="range" min={0} max={3000} step={50} value={boost} onChange={(e) => setBoost(Number(e.target.value))}
                className="mt-4 w-full accent-[#7C3AED]" aria-label="Augmentation nette par mois" />
              <p className="mt-3 text-balance font-display text-[clamp(18px,2.6vw,26px)] font-bold leading-[1.2] text-ink">
                {boost > 0 ? (<>Avec <span className="text-[#6D28D9]">+{euro(boost)} net / mois</span>, vous passeriez du top {baseTop} % au <span className="text-[#0A8F60]">top {effTop} %</span>.</>)
                  : (<>Déplacez le curseur : voyez de combien de places vous gagneriez dans le classement.</>)}
              </p>
              {boost > 0 && <p className="mt-1 text-[13.5px] font-semibold text-slate">Soit un salaire de {showRef(effNet, fmt)} — vous dépasseriez alors {Math.min(99, Math.round(effPct))} % des salariés.</p>}
            </div>
          </section>

          {/* ====== Bloc SEO : quel salaire pour être riche ? ====== */}
          <section className="rounded-[28px] border border-line bg-surface/60 p-6 md:p-8">
            <h3 className="font-display text-[clamp(20px,2.8vw,28px)] font-extrabold tracking-[-0.015em] text-ink">Quel salaire pour être « riche » en France ?</h3>
            <p className="mt-2 max-w-[680px] text-[14px] leading-[1.6] text-slate">En France, le salaire médian du secteur privé est de {showRef(MEDIAN_NET_MONTH, fmt)} et le salaire moyen de {showRef(MEAN_NET_MONTH, fmt)}. La barre du « haut de l’échelle » se situe bien plus loin.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[{ l: "Salaire médian", v: MEDIAN_NET_MONTH, s: "La moitié des salariés gagne moins." }, { l: "Salaire moyen", v: MEAN_NET_MONTH, s: "Tiré vers le haut par les hauts revenus." }, { l: "Top 10 %", v: TOP10_NET_MONTH, s: "Être mieux payé que 9 salariés sur 10." }, { l: "Top 1 %", v: TOP1_NET_MONTH, s: "Le tout début des très hauts salaires." }].map((c) => (
                <div key={c.l} className="rounded-2xl border border-line bg-white/85 p-4">
                  <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#6D28D9]">{c.l}</span>
                  <span className="mt-1 block text-[20px] font-extrabold text-ink">{showRef(c.v, fmt)}</span>
                  <span className="text-[12.5px] text-slate">{c.s}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11.5px] text-slate-soft">Sources : INSEE, « Les salaires dans le secteur privé » ({FR_YEAR}, net mensuel, EQTP) ; les chiffres 2024 (médiane 2 190 €, D9 4 334 €, C99 10 261 €) confirment ces ordres de grandeur. Top 5 % estimé par interpolation. Brut annuel = conversion approximative (≈ +28 %).</p>
          </section>

        </div>
      )}
    </div>
  );
}
