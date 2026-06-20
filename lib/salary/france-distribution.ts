// Distribution des salaires en France — données officielles INSEE.
//
// Source principale : INSEE, « Les salaires dans le secteur privé » (table des déciles 2023,
// salaire net mensuel en équivalent temps plein, secteur privé). Les chiffres 2024 publiés en
// octobre 2025 (médiane 2 190 €, D9 4 334 €, C99 10 261 €, moyenne 2 733 €) confirment ces ordres
// de grandeur ; on retient l'année 2023 car la table décile complète (D1→D9 + C99) y est disponible
// sur un champ homogène.
//
// IMPORTANT (cohérence des formats) : toutes les valeurs ci-dessous sont en NET MENSUEL.
// Les conversions net annuel / brut annuel se font à l'affichage (voir helpers).

export const FR_SOURCE = "INSEE — salaires du secteur privé (net mensuel, équivalent temps plein)";
export const FR_YEAR = 2023;
export const NET2GROSS = 1 / 0.78; // approximation cohérente avec le reste du site (~22 % de cotisations salariales)

// Déciles + 99e centile — net mensuel EQTP, secteur privé, INSEE 2023.
// p = pourcentage de salariés gagnant MOINS que la valeur.
export const DECILES_NET_MONTH: { p: number; v: number }[] = [
  { p: 10, v: 1512 }, // D1
  { p: 20, v: 1671 }, // D2
  { p: 30, v: 1821 }, // D3
  { p: 40, v: 1988 }, // D4
  { p: 50, v: 2183 }, // médiane (D5)
  { p: 60, v: 2432 }, // D6
  { p: 70, v: 2769 }, // D7
  { p: 80, v: 3281 }, // D8
  { p: 90, v: 4302 }, // D9 — seuil du top 10 %
  { p: 99, v: 10222 }, // C99 — seuil du top 1 %
];

export const SMIC_NET_MONTH = 1383; // SMIC net mensuel fin 2023 (repère)
export const MEAN_NET_MONTH = 2735; // salaire net moyen 2023
export const MEDIAN_NET_MONTH = 2183;
export const TOP10_NET_MONTH = 4302;
export const TOP1_NET_MONTH = 10222;
// Seuil du top 5 % (95e centile) : non publié tel quel par l'INSEE pour 2023 → estimé par
// interpolation entre le 9e décile et le 99e centile. Marqué comme estimation dans l'UI.
export const TOP5_NET_MONTH_EST = 6970;

const lerp = (x: number, x0: number, x1: number, y0: number, y1: number) =>
  y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);

// Percentile (0–100) d'un salaire net mensuel donné : interpolation monotone en log entre les déciles INSEE.
export function percentileOfNetMonthly(net: number): number {
  if (!(net > 0)) return 0;
  const k = DECILES_NET_MONTH;
  const lnv = k.map((d) => Math.log(d.v));
  const lx = Math.log(net);
  const n = k.length;
  let p: number;
  if (lx <= lnv[0]) p = lerp(lx, lnv[0], lnv[1], k[0].p, k[1].p);
  else if (lx >= lnv[n - 1]) p = lerp(lx, lnv[n - 2], lnv[n - 1], k[n - 2].p, k[n - 1].p);
  else {
    p = 50;
    for (let i = 0; i < n - 1; i++) {
      if (lx >= lnv[i] && lx <= lnv[i + 1]) { p = lerp(lx, lnv[i], lnv[i + 1], k[i].p, k[i + 1].p); break; }
    }
  }
  return Math.max(0.5, Math.min(99.9, p));
}

// Salaire net mensuel correspondant à un percentile donné (inverse).
export function netMonthlyForPercentile(p: number): number {
  const k = DECILES_NET_MONTH;
  const lnv = k.map((d) => Math.log(d.v));
  const n = k.length;
  if (p <= k[0].p) return Math.exp(lerp(p, k[0].p, k[1].p, lnv[0], lnv[1]));
  if (p >= k[n - 1].p) return Math.exp(lerp(p, k[n - 2].p, k[n - 1].p, lnv[n - 2], lnv[n - 1]));
  for (let i = 0; i < n - 1; i++) {
    if (p >= k[i].p && p <= k[i + 1].p) return Math.exp(lerp(p, k[i].p, k[i + 1].p, lnv[i], lnv[i + 1]));
  }
  return k[4].v;
}

// Seuils « top X % » (net mensuel). estimate = interpolé (non publié tel quel).
export const TOP_THRESHOLDS: { topPct: number; netMonth: number; estimate: boolean }[] = [
  { topPct: 50, netMonth: MEDIAN_NET_MONTH, estimate: false },
  { topPct: 30, netMonth: 2769, estimate: false },
  { topPct: 20, netMonth: 3281, estimate: false },
  { topPct: 10, netMonth: TOP10_NET_MONTH, estimate: false },
  { topPct: 5, netMonth: TOP5_NET_MONTH_EST, estimate: true },
  { topPct: 1, netMonth: TOP1_NET_MONTH, estimate: false },
];

// Repères de la jauge (net mensuel) + libellé + indication d'estimation.
export const GAUGE_REFS: { key: string; label: string; netMonth: number; estimate?: boolean }[] = [
  { key: "smic", label: "SMIC", netMonth: SMIC_NET_MONTH },
  { key: "median", label: "Salaire médian", netMonth: MEDIAN_NET_MONTH },
  { key: "mean", label: "Salaire moyen", netMonth: MEAN_NET_MONTH },
  { key: "top10", label: "Top 10 %", netMonth: TOP10_NET_MONTH },
  { key: "top5", label: "Top 5 %", netMonth: TOP5_NET_MONTH_EST, estimate: true },
  { key: "top1", label: "Top 1 %", netMonth: TOP1_NET_MONTH },
];
