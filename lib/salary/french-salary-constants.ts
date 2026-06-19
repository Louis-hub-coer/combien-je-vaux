/**
 * Constantes sociales & fiscales françaises — millésime : 2026 / revenus 2025.
 *
 * ⚠️ Estimation INDICATIVE. Ces taux sont des moyennes destinées à une simulation
 * grand public. Les conventions collectives, aides, exonérations, prévoyance,
 * heures supplémentaires défiscalisées et cas particuliers peuvent modifier le
 * résultat réel. Ce n'est pas un calcul officiel de bulletin de paie.
 *
 * Références ayant servi à calibrer la logique : simulateur Urssaf / Mon-entreprise
 * (brut↔net salarié), barème IR 2026 sur les revenus 2025 (Service-public /
 * economie.gouv), plafond de la Sécurité sociale et SMIC en vigueur.
 */

export const TAX_YEAR_LABEL = "Estimation 2026 · revenus 2025";

/** Barème IR 2026 (revenus 2025) — tranches annuelles, par part fiscale. */
export const IR_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 11_600, rate: 0 },
  { upTo: 29_579, rate: 0.11 },
  { upTo: 84_577, rate: 0.30 },
  { upTo: 181_917, rate: 0.41 },
  { upTo: Infinity, rate: 0.45 },
];

/** Décote (paramètres indicatifs) : réduit l'impôt des foyers modestes. */
export const DECOTE = { single: 889, couple: 1470, rate: 0.4525 };

/** Abattement forfaitaire de 10 % pour frais professionnels (plafonné). */
export const ABATEMENT = { rate: 0.10, min: 495, max: 14_171 };

/** Part de CSG/CRDS non déductible réintégrée à l'assiette imposable (~ du brut). */
export const NON_DEDUCTIBLE_CSG_RATE = 0.029;

/** Plafond annuel de la Sécurité sociale (PASS). */
export const PASS_ANNUAL = 47_100;

/** SMIC mensuel brut (35 h) — référence de la réduction générale. */
export const SMIC_MONTHLY = 1_801.80;

/**
 * Cotisations salariales estimées (taux moyens) :
 * t1 = part ≤ PASS, t2 = part > PASS (retraite complémentaire tranche 2, etc.).
 */
export const EMPLOYEE_RATES: Record<string, { t1: number; t2: number }> = {
  "non-cadre": { t1: 0.22, t2: 0.25 },
  cadre: { t1: 0.25, t2: 0.28 },
};

/** Cotisations patronales estimées (avant réduction générale). */
export const EMPLOYER_RATE: Record<string, number> = {
  "non-cadre": 0.42,
  cadre: 0.43,
};

/** Réduction générale (ex-Fillon) : coefficient max au SMIC, nul à 1,6 SMIC. */
export const REDUCTION_GENERALE = { max: 0.3194, ceilingSmicFactor: 1.6, phaseRange: 0.6 };
