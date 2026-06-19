import { trigrams } from "./normalize";
import type { IndexedRecord } from "./dataset";
import type { MatchType, SearchResultItem } from "../../types/search";

/** Au-dessus de ce score : vraie correspondance (sinon repli flou). */
export const GOOD_SCORE = 260;

// Mots vides retirés des requêtes (mais conservés à l'indexation).
export const STOP = new Set(["de", "du", "des", "la", "le", "les", "l", "d", "un", "une", "et", "en", "au", "aux", "pour", "the", "of"]);

// Expansion sémantique : concept -> tokens équivalents (normalisés).
const SYNONYMS: Record<string, string[]> = {
  banque: ["banque", "bfi", "investissement", "financiers", "marches", "finance", "cib"],
  banques: ["banque", "bfi", "investissement", "financiers", "marches"],
  bfi: ["bfi", "banque", "investissement", "financiers", "marches", "cib", "corporate"],
  investissement: ["investissement", "banque", "bfi", "financiers", "marches"],
  marche: ["marche", "marches", "financiers", "trading"],
  marches: ["marches", "marche", "financiers", "trading"],
  financier: ["financier", "financiers", "banque", "marches"],
  financiers: ["financiers", "financier", "banque", "marches"],
  finance: ["finance", "banque", "marches", "financiers", "investissement"],
  trading: ["trading", "trader", "sales", "marches"],
  trader: ["trader", "trading", "marches"],
  sales: ["sales", "vente", "ventes"],
  americaine: ["americaine", "americain", "us", "america", "bofa", "goldman", "sachs", "morgan", "stanley", "citi", "citigroup", "jp", "jpmorgan", "jefferies"],
  americain: ["americain", "americaine", "us", "america", "bofa", "goldman", "sachs", "morgan", "stanley", "citi"],
  prof: ["prof", "professeur"],
  professeur: ["professeur", "prof"],
  sport: ["sport", "sportif", "sportive", "eps"],
  medecin: ["medecin", "docteur", "praticien"],
  associate: ["associate", "analyste"],
  analyste: ["analyste", "analyst", "associate"],
};

// Déclencheurs d'intention « finance / marchés ».
const FINANCE_CORE = new Set(["banque", "banques", "bfi", "investissement", "marche", "marches", "financier", "financiers", "finance", "bourse", "trading", "trader", "cib"]);

// Entreprises « exotiques / spécifiques » à éviter quand non demandées.
const FOREIGN_MARKER = new Set(["americaine", "americain", "american", "us", "internationale", "international", "big", "tier", "scale", "serie"]);

// Marques finance : utilisées comme INDICE (jamais affichées). Déclenchent l'intention
// finance et l'ajout de concepts finance, pour router « Trader Goldman Sachs », « Sales BofA »,
// « Associate M&A Lazard », « Amundi sales »… vers la bonne fiche générique.
const BRAND_FINANCE = new Set([
  "goldman", "sachs", "morgan", "stanley", "jpmorgan", "jp", "citi", "citigroup",
  "barclays", "ubs", "hsbc", "deutsche", "nomura", "jefferies", "moelis", "evercore",
  "merrill", "bofa", "blackrock", "blackstone", "kkr", "carlyle",
  "bnp", "paribas", "socgen", "natixis", "cacib", "amundi", "rothschild", "lazard",
  "oddo", "kepler", "exane",
]);
const FINANCE_CONCEPTS = ["finance", "banque", "bfi", "marches", "financiers", "investissement"];

export interface QueryContext {
  qNorm: string;
  qTokens: string[];      // tokens utiles (sans mots vides)
  concepts: string[][];   // un groupe de synonymes par token utile
  expanded: Set<string>;  // union de tous les synonymes
  financeIntent: boolean;
}

/** Prépare une fois par requête les données dérivées (synonymes, intention). */
export function buildContext(normalizedQuery: string): QueryContext {
  const all = normalizedQuery ? normalizedQuery.split(" ").filter(Boolean) : [];
  const useful = all.filter((t) => !STOP.has(t));
  const qTokens = useful.length ? useful : all;
  // Concepts = synonymes + forme au singulier (tolérance pluriels : « traders » -> « trader »).
  const concepts = qTokens.map((t) => {
    const base = SYNONYMS[t] ?? [t];
    const sing = t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : null;
    return sing && !base.includes(sing) ? [...base, sing] : base;
  });
  const expanded = new Set<string>();
  concepts.forEach((g) => g.forEach((x) => expanded.add(x)));

  let financeIntent = qTokens.some((t) => FINANCE_CORE.has(t));
  // Une marque finance dans la requête = indice finance (concepts finance ajoutés).
  if (qTokens.some((t) => BRAND_FINANCE.has(t))) {
    financeIntent = true;
    for (const c of FINANCE_CONCEPTS) expanded.add(c);
  }
  return { qNorm: normalizedQuery, qTokens, concepts, expanded, financeIntent };
}

/** Score d'un enregistrement ; 0 = non candidat. */
export function scoreRecord(r: IndexedRecord, ctx: QueryContext): { score: number; matchType: MatchType } {
  const { qNorm, qTokens, concepts, expanded, financeIntent } = ctx;

  const inHay = qNorm.length > 0 && r.haystack.includes(qNorm);
  let covered = 0;
  for (const group of concepts) if (group.some((t) => r.tokens.has(t))) covered++;
  const coverage = concepts.length ? covered / concepts.length : 0;
  if (!inHay && covered === 0) return { score: 0, matchType: "coverage" };

  let jobHit = false;
  let compHit = false;
  for (const t of expanded) {
    if (!jobHit && r.jobTokens.has(t)) jobHit = true;
    if (!compHit && r.companyTokens.has(t)) compHit = true;
    if (jobHit && compHit) break;
  }

  let score = 0;
  let matchType: MatchType = "coverage";
  const exact = qNorm === r.nameNorm || qNorm === r.canonicalNorm;
  const keyExact = r.keysNorm.includes(qNorm);

  if (exact) { score += 1000; matchType = r.isPerson ? "person" : "exact"; }
  if (keyExact) { score += 560; if (matchType === "coverage") matchType = "keyword"; }
  if (jobHit && compHit) { score += 640; if (matchType === "coverage") matchType = "job_company"; }
  if (inHay) score += 180;
  if (qNorm && r.nameNorm.startsWith(qNorm)) score += 150;
  for (const t of expanded) { if (r.keysNorm.some((k) => k.includes(t))) { score += 80; break; } }

  score += Math.round(coverage * 240);
  score += Math.min(r.priority, 125) * 0.7; // search_priority (0..125)
  if (r.isDefault) score += 90;             // remplace verification_status

  // Boost : le métier générique recherché est ENTIÈREMENT contenu dans la requête
  // (ex. « trader goldman sachs » -> « Trader » ; « data scientist google paris » -> « Data scientist »).
  if (!r.isPerson && r.jobTokens.size > 0) {
    let jobFull = true;
    for (const t of r.jobTokens) if (!expanded.has(t)) { jobFull = false; break; }
    if (jobFull) { score += 500; if (matchType === "coverage") matchType = "job_company"; }
  }

  // Pénalité : entreprise présente mais NON demandée (métiers uniquement, pas les personnes).
  if (!r.isPerson && r.companyTokens.size > 0 && !compHit) {
    score -= 150;
    if (hasForeignMarker(r.companyTokens)) score -= 70; // ex. « Banque américaine Paris »
  }

  // Boost secteur : intention finance + catégorie finance.
  if (financeIntent && r.isFinance) score += 220;

  // Garde-fou personnalités : une perso ne l'emporte que si une part suffisante des mots
  // de la requête correspond à SON NOM (évite « Paris Hilton » pour « data scientist google paris »,
  // ou « Black M » pour « associate m&a lazard »). N'affecte pas les recherches d'1 seul mot.
  let personWeak = false;
  if (r.isPerson && qTokens.length >= 2) {
    const nameToks = new Set(r.nameNorm.split(" ").filter(Boolean));
    let matched = 0;
    for (const t of qTokens) if (nameToks.has(t)) matched++;
    if (matched / qTokens.length < 0.5) { score -= 650; personWeak = true; }
  }

  // Notoriété d'une personnalité via le salaire (Kylian ≫ Ethan Mbappé).
  if (r.isPerson && !personWeak && r.salaryTotalEur && r.salaryTotalEur > 0) {
    score += clamp(Math.log10(r.salaryTotalEur) - 5, 0, 4) * 60;
  }

  return { score: Math.round(score), matchType };
}

function hasForeignMarker(tokens: Set<string>): boolean {
  for (const m of FOREIGN_MARKER) if (tokens.has(m)) return true;
  return false;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return (2 * inter) / (a.size + b.size);
}

/** Similarité floue (Dice sur trigrammes du nom) — calculée à la volée (repli rare). */
export function fuzzyScore(r: IndexedRecord, qNorm: string): number {
  return dice(trigrams(qNorm), trigrams(`${r.nameNorm} ${r.canonicalNorm}`));
}

/** Tri : score, priorité, défaut, salaire (notoriété), entreprise la plus courte, alpha. */
export function compareScored(a: SearchResultItem, b: SearchResultItem): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.priority !== a.priority) return b.priority - a.priority;
  if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
  const sa = a.salaryTotalEur ?? -1;
  const sb = b.salaryTotalEur ?? -1;
  if (sb !== sa) return sb - sa;
  if (a.company.length !== b.company.length) return a.company.length - b.company.length;
  return a.displayName.localeCompare(b.displayName);
}
