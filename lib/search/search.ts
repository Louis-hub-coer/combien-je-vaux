import "server-only"; // garde-fou serveur
import { getDataset, type IndexedRecord } from "./dataset";
import { normalizeQuery, normalizeText } from "./normalize";
import { buildContext, scoreRecord, fuzzyScore, compareScored, GOOD_SCORE, STOP } from "./rank";
import { isBlockedQuery } from "./guardrails";
import { detectBrand } from "./brands";
import type { SearchParams, SearchResponse, SearchResultItem, MatchType, GroupVariant } from "../../types/search";

const MIN_Q = 2;

function toItem(r: IndexedRecord, score: number, matchType: MatchType): SearchResultItem {
  return {
    id: r.id,
    slug: r.slug,
    type: r.type,
    displayName: r.displayName,
    canonicalName: r.canonicalName,
    category: r.category,
    subCategory: r.subCategory,
    job: r.job,
    position: r.position,
    specialization: r.specialization,
    company: r.company,
    city: r.city,
    country: r.country,
    experience: r.experience,
    salaryDisplay: r.salaryDisplay,
    salaryTotalEur: r.salaryTotalEur,
    salaryFixedEur: r.salaryFixedEur,
    salaryVariableEur: r.salaryVariableEur,
    shortAnswer: r.shortAnswer,
    isDefault: r.isDefault,
    priority: r.priority,
    groupKey: r.groupKey,
    score,
    matchType,
  };
}

/**
 * Clé de dédoublonnage :
 *  - match métier+entreprise -> clé complète (on garde les entreprises distinctes) ;
 *  - sinon -> clé « métier » seule (on regroupe les variantes d'entreprise non demandées).
 */
function dedupeKey(it: SearchResultItem): string {
  const gk = it.groupKey || it.id;
  if (it.matchType === "job_company") return gk;
  const cut = gk.indexOf("|company:");
  return cut >= 0 ? gk.slice(0, cut) : gk;
}

function dedupe(items: SearchResultItem[]): SearchResultItem[] {
  const seen = new Set<string>();
  const out: SearchResultItem[] = [];
  for (const it of items) {
    const k = dedupeKey(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

/** Résout un intitulé de métier (ex. « Analyste M&A ») vers sa ligne représentative (is_default). */
function findMetier(records: IndexedRecord[], label: string): IndexedRecord | null {
  const n = normalizeText(label);
  let best: IndexedRecord | null = null;
  for (const r of records) {
    if (r.type === "personne_nom") continue;
    if (normalizeText(r.displayName) === n || normalizeText(r.job) === n) {
      if (!best || (r.isDefault && !best.isDefault)) best = r;
    }
  }
  return best;
}

/**
 * Recherche unique partagée SSR (/salaires) + API. Le CSV reste serveur ;
 * on ne renvoie qu'un objet léger (meilleur résultat + proches limités).
 */
export async function searchSalaries({ q, limit }: SearchParams): Promise<SearchResponse> {
  const start = Date.now();
  const query = (q ?? "").trim();
  const normalizedQuery = normalizeQuery(query);
  void limit; // le nombre de proches est fixé par RELATED_COUNT

  if (normalizedQuery.length < MIN_Q) {
    return { query, normalizedQuery, best: null, results: [], total: 0, fallbackUsed: false, tookMs: Date.now() - start };
  }

  // Garde-fou : requête offensante -> état propre, aucun résultat, aucun fuzzy.
  if (isBlockedQuery(normalizedQuery)) {
    return { query, normalizedQuery, best: null, results: [], total: 0, fallbackUsed: false, blocked: true, tookMs: Date.now() - start };
  }

  const { records, groupIndex } = await getDataset();

  // Entreprise saisie SEULE -> métier représentatif (best) + métiers associés (proches).
  // L'affichage reste générique (jamais la marque dans le titre).
  const brand = detectBrand(normalizedQuery);
  if (brand) {
    const stripRe = new RegExp(brand.re.source, "g");
    const rest = normalizedQuery.replace(stripRe, " ").replace(/\s+/g, " ").trim();
    const restMeaningful = rest.split(" ").filter((t) => t && t.length >= 2 && !STOP.has(t));
    if (restMeaningful.length === 0) {
      const recs = brand.metiers
        .map((label) => findMetier(records, label))
        .filter((r): r is IndexedRecord => !!r);
      if (recs.length) {
        const best = toItem(recs[0], 1000, "company");
        best.groupVariants = groupVariantsFor(best.groupKey, groupIndex);
        const results = recs.slice(1, 1 + RELATED_COUNT).map((r) => toItem(r, 900, "company"));
        return {
          query,
          normalizedQuery,
          best,
          results,
          total: recs.length,
          fallbackUsed: false,
          companyLabel: brand.label,
          tookMs: Date.now() - start,
        };
      }
    }
  }

  const ctx = buildContext(normalizedQuery);

  // 1) candidats + scoring
  const scored: SearchResultItem[] = [];
  for (const r of records) {
    const { score, matchType } = scoreRecord(r, ctx);
    if (score > 0) scored.push(toItem(r, score, matchType));
  }
  scored.sort(compareScored);

  // 2) repli flou si rien de solide
  let pool = scored;
  let fallbackUsed = false;
  if (!scored.length || scored[0].score < GOOD_SCORE) {
    const fuzzy: SearchResultItem[] = [];
    for (const r of records) {
      const s = fuzzyScore(r, normalizedQuery);
      // Seuil global relevé ; seuil renforcé pour les personnalités afin de ne PAS
      // matcher une personne quand la requête ne ressemble pas vraiment à son nom.
      const min = r.isPerson ? 0.55 : 0.4;
      if (s > min) fuzzy.push(toItem(r, Math.round(s * 100), "fuzzy"));
    }
    fuzzy.sort(compareScored);
    if (fuzzy.length) { pool = fuzzy; fallbackUsed = true; }
  }

  const deduped = dedupe(pool);
  const best = deduped[0] ?? null;
  if (best) best.groupVariants = groupVariantsFor(best.groupKey, groupIndex);

  const results = best ? relatedFor(best, deduped, records) : [];

  return {
    query,
    normalizedQuery,
    best,
    results,
    total: scored.length,
    fallbackUsed,
    tookMs: Date.now() - start,
  };
}

/* ----------------------- Résultats proches (exploratoires) ----------------------- */

const RELATED_COUNT = 5;

function norm(s: string): string {
  return normalizeText(s ?? "");
}
/** Famille pour diversifier : un métier ≈ son intitulé ; une personne ≈ son nom. */
function famKey(it: SearchResultItem): string {
  if (it.type === "personne_nom") return "p:" + norm(it.displayName);
  return "m:" + (norm(it.job) || norm(it.displayName));
}
/** Genre d'une personnalité (pour proposer des pairs cohérents). */
function personGenre(category: string, subCategory: string): string {
  const t = norm(`${category} ${subCategory}`);
  if (/football|footballeur/.test(t)) return "football";
  if (/basket/.test(t)) return "basket";
  if (/tennis/.test(t)) return "tennis";
  if (/rugby/.test(t)) return "rugby";
  if (/sport|athlet/.test(t)) return "sport";
  if (/musiq|chanteur|artiste|\bdj\b|rappeur|\brap\b/.test(t)) return "musique";
  if (/acteur|cinema|realisateur|serie/.test(t)) return "acteur";
  if (/youtub|tiktok|twitch|stream|createur|influence/.test(t)) return "createur";
  if (/business|politique|media|dirigeant|entrepreneur/.test(t)) return "business";
  return "autre";
}

/**
 * Sélection éditoriale de 5 résultats proches, diversifiée :
 *  - personnalité -> pairs du même genre (autres footballeurs, etc.) ;
 *  - métier -> 1-2 proches du même univers, puis autres métiers du secteur,
 *    puis métiers à revenu comparable / populaires.
 */
function relatedFor(
  best: SearchResultItem,
  deduped: SearchResultItem[],
  records: IndexedRecord[],
): SearchResultItem[] {
  const chosen: SearchResultItem[] = [];
  const used = new Set<string>([best.id]);
  const famCount = new Map<string, number>();

  const tryAdd = (it: SearchResultItem, maxPerFam = 1): void => {
    if (chosen.length >= RELATED_COUNT || used.has(it.id)) return;
    if (it.displayName === best.displayName) return;
    if (chosen.some((c) => c.displayName === it.displayName)) return;
    const f = famKey(it);
    if ((famCount.get(f) ?? 0) >= maxPerFam) return;
    used.add(it.id);
    famCount.set(f, (famCount.get(f) ?? 0) + 1);
    chosen.push(it);
  };

  if (best.type === "personne_nom") {
    const genre = personGenre(best.category, best.subCategory);
    // 1) pairs nominatifs déjà repérés par le scoring (ex. même nom de famille)
    for (const it of deduped) {
      if (chosen.length >= 2) break;
      if (it.type === "personne_nom") tryAdd(it, 1);
    }
    // 2) personnalités du même genre, triées par notoriété (priority) puis revenu
    const peers = records
      .filter(
        (r) =>
          r.isPerson &&
          r.id !== best.id &&
          genre !== "autre" &&
          personGenre(r.category, r.subCategory) === genre,
      )
      .sort((a, b) => b.priority - a.priority || (b.salaryTotalEur ?? 0) - (a.salaryTotalEur ?? 0));
    for (const r of peers) {
      if (chosen.length >= RELATED_COUNT) break;
      tryAdd(toItem(r, 0, "related"), 1);
    }
    // 3) complément : autres personnalités populaires
    if (chosen.length < RELATED_COUNT) {
      const top = records
        .filter((r) => r.isPerson && r.id !== best.id)
        .sort((a, b) => b.priority - a.priority || (b.salaryTotalEur ?? 0) - (a.salaryTotalEur ?? 0));
      for (const r of top) {
        if (chosen.length >= RELATED_COUNT) break;
        tryAdd(toItem(r, 0, "related"), 1);
      }
    }
    return chosen.slice(0, RELATED_COUNT);
  }

  // ---- MÉTIERS ----
  const bestSub = norm(best.subCategory);
  const bestCat = norm(best.category);
  const bestCompany = norm(best.company);
  const bestSalary = best.salaryTotalEur ?? 0;

  // A) jusqu'à 3 proches du même univers : même sous-catégorie, ou même entreprise
  //    — la proximité « entreprise » n'est utilisée que si l'entreprise faisait partie
  //    de la recherche (évite de lister toutes les spécialités d'un « cabinet » générique).
  const companyIntent = best.matchType === "job_company" && !!best.company;
  let near = 0;
  for (const it of deduped) {
    if (near >= 3 || chosen.length >= RELATED_COUNT) break;
    if (it.type === "personne_nom" || it.id === best.id) continue;
    const sameSub = !!it.subCategory && norm(it.subCategory) === bestSub;
    const sameCompany = companyIntent && !!it.company && norm(it.company) === bestCompany;
    if (sameSub || sameCompany) {
      const before = chosen.length;
      tryAdd(it, 2);
      if (chosen.length > before) near++;
    }
  }
  // B) autres métiers du même secteur (même catégorie, sous-catégorie différente), proches en revenu
  const sector = records
    .filter(
      (r) =>
        !r.isPerson &&
        r.id !== best.id &&
        norm(r.category) === bestCat &&
        norm(r.subCategory) !== bestSub &&
        r.salaryTotalEur != null,
    )
    .sort(
      (a, b) =>
        Math.abs((a.salaryTotalEur ?? 0) - bestSalary) - Math.abs((b.salaryTotalEur ?? 0) - bestSalary) ||
        b.priority - a.priority,
    );
  let sectorAdded = 0;
  for (const r of sector) {
    if (sectorAdded >= 2 || chosen.length >= RELATED_COUNT) break;
    const before = chosen.length;
    tryAdd(toItem(r, 0, "related"), 1);
    if (chosen.length > before) sectorAdded++;
  }
  // C) métiers à revenu comparable, autres secteurs (exploration) + populaires
  const lo = bestSalary * 0.55;
  const hi = bestSalary * 1.8;
  const comparable = records
    .filter(
      (r) =>
        !r.isPerson &&
        r.id !== best.id &&
        r.isDefault &&
        r.salaryTotalEur != null &&
        r.salaryTotalEur >= lo &&
        r.salaryTotalEur <= hi &&
        norm(r.category) !== bestCat,
    )
    .sort((a, b) => b.priority - a.priority || (b.salaryTotalEur ?? 0) - (a.salaryTotalEur ?? 0));
  for (const r of comparable) {
    if (chosen.length >= RELATED_COUNT) break;
    tryAdd(toItem(r, 0, "related"), 1);
  }
  // D) filet de sécurité : compléter avec le reste du scoring
  if (chosen.length < RELATED_COUNT) {
    for (const it of deduped) {
      if (chosen.length >= RELATED_COUNT) break;
      if (it.type !== "personne_nom" && it.id !== best.id) tryAdd(it, 2);
    }
  }
  return chosen.slice(0, RELATED_COUNT);
}

/** Variantes d'un même groupe (ville × expérience), dédupliquées par (ville|expérience). */
function groupVariantsFor(
  groupKey: string,
  groupIndex: Map<string, IndexedRecord[]>,
): GroupVariant[] {
  if (!groupKey) return [];
  const group = groupIndex.get(groupKey);
  if (!group) return [];
  const byKey = new Map<string, IndexedRecord>();
  for (const r of group) {
    if (r.salaryTotalEur == null) continue;
    const specKey = (r.specialization || "").trim().toLowerCase();
    const cityKey = (r.city || r.country || "").trim().toLowerCase();
    const xp = (r.experience ?? "").trim();
    const key = `${specKey}|${cityKey}|${xp}`;
    const cur = byKey.get(key);
    if (!cur || (r.isDefault && !cur.isDefault)) byKey.set(key, r);
  }
  return [...byKey.values()]
    .map((r) => ({
      specialization: r.specialization.trim(),
      city: r.city,
      country: r.country,
      experience: r.experience.trim(),
      salaryTotalEur: r.salaryTotalEur,
      salaryFixedEur: r.salaryFixedEur,
      salaryVariableEur: r.salaryVariableEur,
      isDefault: r.isDefault,
    }))
    .slice(0, 200);
}
