/**
 * Moteur de conversion brut ↔ net (logique interne, sans API externe).
 * Millésime des règles : 2026 / revenus 2025 (voir french-salary-constants).
 * Toutes les valeurs renvoyées sont des estimations indicatives.
 */
import {
  IR_BRACKETS,
  DECOTE,
  ABATEMENT,
  NON_DEDUCTIBLE_CSG_RATE,
  PASS_ANNUAL,
  SMIC_MONTHLY,
  EMPLOYEE_RATES,
  EMPLOYER_RATE,
  REDUCTION_GENERALE,
} from "./french-salary-constants";

export type Status = "cadre" | "non-cadre";
export type Period = "mensuel" | "annuel";
export type TaxMode = "pas" | "bareme";
export type Contract = "cdi" | "cdd" | "interim" | "stage" | "alternance";

/** Stage et alternance : gratification / salaire largement exonérés de cotisations. */
const EXEMPT_CONTRACTS: Contract[] = ["stage", "alternance"];

export interface NormalizeInput {
  amount: number;
  period: Period;
  partTimePercent?: number; // 100 par défaut
  thirteenthMonth?: boolean; // pris en compte si saisie mensuelle
  bonusAnnual?: number;
}

export interface ComputeOptions {
  status: Status;
  contract?: Contract; // défaut cdi ; stage/alternance -> cotisations exonérées
  mutuelleMonthly?: number;
  ticketsRestoMonthly?: number; // part salarié (déduite du net)
  parts?: number; // quotient familial (défaut 1)
  isCouple?: boolean; // pour la décote
  pasRate?: number | null; // 0..1 si connu
  taxMode?: TaxMode; // "pas" si taux fourni, sinon "bareme"
}

export interface BrutNetResult {
  grossAnnual: number;
  grossMonthly: number;
  employeeContributions: number;
  employeeRate: number;
  netBeforeTaxAnnual: number;
  netBeforeTaxMonthly: number;
  taxableIncome: number;
  incomeTaxAnnual: number;
  taxSource: TaxMode;
  pasRateUsed: number;
  netAfterTaxAnnual: number;
  netAfterTaxMonthly: number;
  employerContributions: number;
  employerCostAnnual: number;
  employerCostMonthly: number;
}

/** Normalise une saisie en brut ANNUEL et MENSUEL (gère temps partiel, 13e mois, bonus). */
export function normalizeGrossSalary(input: NormalizeInput): { grossAnnual: number; grossMonthly: number } {
  const pt = (input.partTimePercent ?? 100) / 100;
  let base: number;
  if (input.period === "mensuel") {
    const monthly = input.amount * pt;
    base = monthly * (input.thirteenthMonth ? 13 : 12);
  } else {
    base = input.amount * pt;
  }
  const grossAnnual = Math.max(0, base + (input.bonusAnnual ?? 0));
  return { grossAnnual, grossMonthly: grossAnnual / 12 };
}

/** Cotisations salariales estimées (deux tranches autour du PASS). */
export function calculateEmployeeContributions(grossAnnual: number, status: Status): { amount: number; rate: number } {
  const r = EMPLOYEE_RATES[status] ?? EMPLOYEE_RATES["non-cadre"];
  const t1 = Math.min(grossAnnual, PASS_ANNUAL) * r.t1;
  const t2 = Math.max(0, grossAnnual - PASS_ANNUAL) * r.t2;
  const amount = t1 + t2;
  return { amount, rate: grossAnnual > 0 ? amount / grossAnnual : 0 };
}

/** Cotisations patronales estimées, avec réduction générale pour les bas salaires. */
export function calculateEmployerContributions(grossAnnual: number, status: Status): number {
  const base = grossAnnual * (EMPLOYER_RATE[status] ?? EMPLOYER_RATE["non-cadre"]);
  const smicAnnual = SMIC_MONTHLY * 12;
  const ceiling = REDUCTION_GENERALE.ceilingSmicFactor * smicAnnual;
  let reduction = 0;
  if (grossAnnual > 0 && grossAnnual < ceiling) {
    let coef = (REDUCTION_GENERALE.max / REDUCTION_GENERALE.phaseRange) * (ceiling / grossAnnual - 1);
    coef = Math.min(REDUCTION_GENERALE.max, Math.max(0, coef));
    reduction = coef * grossAnnual;
  }
  return Math.max(0, base - reduction);
}

/** Impôt annuel par application du barème au quotient familial, puis décote. */
export function calculateIncomeTaxEstimate(params: { taxableIncome: number; parts: number; isCouple: boolean }): {
  taxableIncome: number;
  tax: number;
  averageRate: number;
} {
  const parts = Math.max(1, params.parts || 1);
  const perPart = Math.max(0, params.taxableIncome) / parts;
  let taxPerPart = 0;
  let prev = 0;
  for (const b of IR_BRACKETS) {
    if (perPart > b.upTo) {
      taxPerPart += (b.upTo - prev) * b.rate;
      prev = b.upTo;
    } else {
      taxPerPart += (perPart - prev) * b.rate;
      break;
    }
  }
  let tax = Math.max(0, taxPerPart * parts);
  // Décote (foyers modestes)
  const D = params.isCouple ? DECOTE.couple : DECOTE.single;
  if (tax < D / DECOTE.rate) {
    const decote = Math.max(0, D - tax * DECOTE.rate);
    tax = Math.max(0, tax - decote);
  }
  return { taxableIncome: params.taxableIncome, tax, averageRate: params.taxableIncome > 0 ? tax / params.taxableIncome : 0 };
}

/** Net annuel avant impôt = brut − cotisations salariales − mutuelle − tickets. */
export function calculateNetBeforeTax(grossAnnual: number, status: Status, opts?: { mutuelleAnnual?: number; ticketsAnnual?: number }): number {
  const c = calculateEmployeeContributions(grossAnnual, status);
  return Math.max(0, grossAnnual - c.amount - (opts?.mutuelleAnnual ?? 0) - (opts?.ticketsAnnual ?? 0));
}

/** Coût employeur annuel = brut + cotisations patronales estimées. */
export function calculateEmployerCost(grossAnnual: number, status: Status): number {
  return grossAnnual + calculateEmployerContributions(grossAnnual, status);
}

/** Calcul complet à partir d'un brut ANNUEL déjà normalisé. */
function computeFromGrossAnnual(grossAnnual: number, opts: ComputeOptions): BrutNetResult {
  const status = opts.status;
  const contract = opts.contract ?? "cdi";
  const exempt = EXEMPT_CONTRACTS.includes(contract);
  const mutuelleAnnual = (opts.mutuelleMonthly ?? 0) * 12;
  const ticketsAnnual = (opts.ticketsRestoMonthly ?? 0) * 12;

  // Stage / alternance : cotisations salariales et patronales considérées exonérées.
  const empC = exempt
    ? { amount: 0, rate: 0 }
    : calculateEmployeeContributions(grossAnnual, status);
  const netBeforeTaxAnnual = Math.max(0, grossAnnual - empC.amount - mutuelleAnnual - ticketsAnnual);

  // Assiette imposable : net avant impôt + CSG/CRDS non déductible, puis abattement 10 %.
  const imposableBrut = netBeforeTaxAnnual + NON_DEDUCTIBLE_CSG_RATE * grossAnnual;
  const abat = Math.min(ABATEMENT.max, Math.max(ABATEMENT.min, ABATEMENT.rate * imposableBrut));
  const taxableIncome = Math.max(0, imposableBrut - abat);

  let incomeTaxAnnual: number;
  let taxSource: TaxMode;
  let pasRateUsed: number;
  if (opts.taxMode === "pas" && opts.pasRate != null) {
    incomeTaxAnnual = Math.max(0, netBeforeTaxAnnual * opts.pasRate);
    taxSource = "pas";
    pasRateUsed = opts.pasRate;
  } else {
    const est = calculateIncomeTaxEstimate({ taxableIncome, parts: opts.parts ?? 1, isCouple: !!opts.isCouple });
    incomeTaxAnnual = est.tax;
    taxSource = "bareme";
    pasRateUsed = netBeforeTaxAnnual > 0 ? incomeTaxAnnual / netBeforeTaxAnnual : 0;
  }

  const netAfterTaxAnnual = Math.max(0, netBeforeTaxAnnual - incomeTaxAnnual);
  const employerContributions = exempt ? 0 : calculateEmployerContributions(grossAnnual, status);
  const employerCostAnnual = grossAnnual + employerContributions;

  return {
    grossAnnual,
    grossMonthly: grossAnnual / 12,
    employeeContributions: empC.amount,
    employeeRate: empC.rate,
    netBeforeTaxAnnual,
    netBeforeTaxMonthly: netBeforeTaxAnnual / 12,
    taxableIncome,
    incomeTaxAnnual,
    taxSource,
    pasRateUsed,
    netAfterTaxAnnual,
    netAfterTaxMonthly: netAfterTaxAnnual / 12,
    employerContributions,
    employerCostAnnual,
    employerCostMonthly: employerCostAnnual / 12,
  };
}

export function calculateNetAfterTax(grossAnnual: number, opts: ComputeOptions): number {
  return computeFromGrossAnnual(grossAnnual, opts).netAfterTaxAnnual;
}

/** Point d'entrée principal : du brut vers tout le détail. */
export function calculateFromGross(input: NormalizeInput, opts: ComputeOptions): BrutNetResult {
  const { grossAnnual } = normalizeGrossSalary(input);
  return computeFromGrossAnnual(grossAnnual, opts);
}

/**
 * Du net (mensuel) vers le brut, par approximation (recherche dichotomique).
 * `basis` = "before" (net avant impôt) ou "after" (net après impôt).
 */
export function calculateFromNet(targetNetMonthly: number, basis: "before" | "after", opts: ComputeOptions): BrutNetResult {
  const target = Math.max(0, targetNetMonthly) * 12;
  let lo = target;
  let hi = target * 2.4 + 12_000;
  let mid = (lo + hi) / 2;
  for (let i = 0; i < 60; i++) {
    mid = (lo + hi) / 2;
    const r = computeFromGrossAnnual(mid, opts);
    const val = basis === "after" ? r.netAfterTaxAnnual : r.netBeforeTaxAnnual;
    if (val < target) lo = mid;
    else hi = mid;
  }
  return computeFromGrossAnnual(mid, opts);
}

/** Format monétaire fr-FR, espaces insécables, suffixe € (montant sur une ligne). */
export function formatSalaryAmount(n: number): string {
  const f = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  return f.format(Math.round(n)).replace(/\u202F/g, "\u00A0") + "\u00A0€";
}

export interface ChartBar {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Données du graphique comparatif (4 barres, en annuel). */
export function buildBrutNetChartData(r: BrutNetResult): ChartBar[] {
  return [
    { key: "employeur", label: "Coût employeur", value: r.employerCostAnnual, color: "#F59E0B" },
    { key: "brut", label: "Salaire brut", value: r.grossAnnual, color: "#7C3AED" },
    { key: "avant", label: "Net avant impôt", value: r.netBeforeTaxAnnual, color: "#2F6BFF" },
    { key: "apres", label: "Net après impôt", value: r.netAfterTaxAnnual, color: "#00C389" },
  ];
}
