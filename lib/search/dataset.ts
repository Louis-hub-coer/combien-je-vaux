import "server-only"; // garde-fou : ne doit jamais atteindre le client
import { readFile } from "node:fs/promises";
import path from "node:path";
import { normalizeText, tokenize } from "./normalize";

/**
 * Mapping logique -> nom RÉEL de colonne (vérifié sur le CSV).
 * SEUL endroit à modifier si une colonne est renommée.
 */
const COL = {
  id: "id",
  type: "type_resultat",
  precision: "niveau_precision",
  name: "nom",
  canonical: "nom_canonique",
  category: "categorie",
  subCategory: "sous_categorie",
  job: "metier",
  position: "poste",
  specialization: "specialisation",
  company: "entreprise",
  country: "pays",
  city: "ville",
  region: "region",
  experience: "experience",
  salaryDisplay: "salaire_affichage",
  salaryTotal: "salaire_reel_total_eur",
  salaryFixed: "salaire_fixe_eur",
  salaryVariable: "salaire_variable_bonus_eur",
  shortAnswer: "reponse_courte_fr",
  slug: "url_slug",
  exactKeys: "search_exact_keys",
  aliases: "search_aliases",
  groupKey: "search_group_key",
  priority: "search_priority",
  isDefault: "is_default_result",
} as const;

type ColKey = keyof typeof COL;

/** Version sérialisable (stockée dans l'index JSON) : aucun Set. */
export interface LeanRecord {
  id: string;
  slug: string;
  type: string;
  displayName: string;
  canonicalName: string;
  category: string;
  subCategory: string;
  job: string;
  position: string;
  specialization: string;
  company: string;
  city: string;
  country: string;
  experience: string;
  salaryDisplay: string;
  salaryTotalEur: number | null;
  salaryFixedEur: number | null;
  salaryVariableEur: number | null;
  shortAnswer: string;
  isDefault: boolean;
  priority: number;
  groupKey: string;
  isPerson: boolean;
  isFinance: boolean;
  nameNorm: string;
  canonicalNorm: string;
  keysNorm: string[];
  jobTokens: string[];
  companyTokens: string[];
  haystack: string;
}

/** Version runtime : Sets pour des lookups O(1) pendant la recherche.
 *  `tokens` est reconstruit depuis `haystack` (pas stocké, pour alléger l'index). */
export interface IndexedRecord extends Omit<LeanRecord, "jobTokens" | "companyTokens"> {
  jobTokens: Set<string>;
  companyTokens: Set<string>;
  tokens: Set<string>;
}

export interface Dataset {
  records: IndexedRecord[];
  groupIndex: Map<string, IndexedRecord[]>; // search_group_key -> lignes (tranches d'expérience, etc.)
}

export const CSV_PATH =
  process.env.SALARY_CSV_PATH ??
  path.join(process.cwd(), "data", "salary_master_33000_claude_ready_minimal.csv");

export const INDEX_PATH =
  process.env.SALARY_INDEX_PATH ?? path.join(process.cwd(), "data", "search-index.json");

// Catégories considérées « finance / marchés ».
const FINANCE_CAT = /banqu|marche financ|marches financ|finance|investissement|bourse|trading|capital market/;

// Mémoïsation : index chargé une seule fois par process.
let cache: Promise<Dataset> | null = null;
export function getDataset(): Promise<Dataset> {
  if (!cache) cache = load();
  return cache;
}

async function load(): Promise<Dataset> {
  let records: IndexedRecord[];
  // 1) chemin rapide : index JSON pré-calculé (JSON.parse natif, pas de re-normalisation)
  try {
    const raw = await readFile(INDEX_PATH, "utf8");
    records = (JSON.parse(raw) as LeanRecord[]).map(hydrate);
  } catch {
    // 2) repli : parsing du CSV (lent) si l'index n'existe pas
    if (process.env.NODE_ENV !== "production") {
      console.warn("[salaires] index absent — parsing CSV (lent). Lancez: npm run build:search-index");
    }
    const text = await readFile(CSV_PATH, "utf8");
    records = buildLeanFromCsv(text).map(hydrate);
  }
  return { records, groupIndex: buildGroupIndex(records) };
}

/** Index par search_group_key (sert aux tranches d'expérience d'un même métier+entreprise). */
function buildGroupIndex(records: IndexedRecord[]): Map<string, IndexedRecord[]> {
  const m = new Map<string, IndexedRecord[]>();
  for (const r of records) {
    if (!r.groupKey) continue;
    const arr = m.get(r.groupKey);
    if (arr) arr.push(r);
    else m.set(r.groupKey, [r]);
  }
  return m;
}

/** Reconstruit les Sets à partir des tableaux (rapide). */
function hydrate(l: LeanRecord): IndexedRecord {
  return {
    ...l,
    jobTokens: new Set(l.jobTokens),
    companyTokens: new Set(l.companyTokens),
    tokens: new Set(l.haystack.split(" ").filter(Boolean)),
  };
}

/** Parse + indexe le CSV en LeanRecord[] (utilisé par le script de build et le repli). */
export function buildLeanFromCsv(text: string): LeanRecord[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const idx = mapHeader(rows[0].map((h) => h.trim()));
  const out: LeanRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 1 && row[0] === "") continue;
    const g = (k: ColKey) => (idx[k] >= 0 ? (row[idx[k]] ?? "").trim() : "");

    const displayName = g("name");
    const canonicalName = g("canonical") || displayName;
    if (!displayName && !canonicalName) continue;

    const type = g("type");
    const job = g("job");
    const position = g("position");
    const specialization = g("specialization");
    const company = g("company");
    const category = g("category");
    const subCategory = g("subCategory");
    const city = g("city");
    const country = g("country");

    const keysNorm = uniq(
      [...splitMulti(g("exactKeys")), ...splitMulti(g("aliases"))].map(normalizeText).filter(Boolean),
    );
    const nameNorm = normalizeText(displayName);
    const canonicalNorm = normalizeText(canonicalName);
    const haystack = normalizeText(
      [nameNorm, canonicalNorm, job, position, specialization, company, category, subCategory, city, country, keysNorm.join(" ")].join(" "),
    );

    out.push({
      id: g("id") || canonicalName || String(i),
      slug: g("slug") || nameNorm.replace(/\s+/g, "-"),
      type,
      displayName,
      canonicalName,
      category,
      subCategory,
      job,
      position,
      specialization,
      company,
      city,
      country,
      experience: g("experience"),
      salaryDisplay: g("salaryDisplay"),
      salaryTotalEur: toNumberOrNull(g("salaryTotal")),
      salaryFixedEur: toNumberOrNull(g("salaryFixed")),
      salaryVariableEur: toNumberOrNull(g("salaryVariable")),
      shortAnswer: g("shortAnswer"),
      isDefault: /^true$/i.test(g("isDefault")),
      priority: toNumber(g("priority")),
      groupKey: g("groupKey"),
      isPerson: type === "personne_nom",
      isFinance: FINANCE_CAT.test(normalizeText(`${category} ${subCategory}`)),
      nameNorm,
      canonicalNorm,
      keysNorm,
      jobTokens: tokenize(normalizeText([job, position, specialization, subCategory].join(" "))),
      companyTokens: tokenize(normalizeText(company)),
      haystack,
    });
  }
  return out;
}

function mapHeader(header: string[]): Record<ColKey, number> {
  const find = (n: string) => header.findIndex((h) => h.toLowerCase() === n.toLowerCase());
  const idx = {} as Record<ColKey, number>;
  const missing: string[] = [];
  (Object.keys(COL) as ColKey[]).forEach((k) => {
    idx[k] = find(COL[k]);
    if (idx[k] < 0) missing.push(COL[k]);
  });
  if (missing.length && process.env.NODE_ENV !== "production") {
    console.warn(`[salaires] colonnes absentes (ignorées) : ${missing.join(", ")}`);
  }
  return idx;
}

// --- helpers ---

/** Parseur CSV robuste (RFC 4180) : guillemets, virgules et sauts de ligne échappés. */
function parseCsv(input: string): string[][] {
  let text = input;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function splitMulti(v: string): string[] {
  return (v ?? "").split("|").map((s) => s.trim()).filter(Boolean);
}
function uniq(a: string[]): string[] {
  return [...new Set(a)];
}
function toNumber(v: string): number {
  const n = parseFloat((v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function toNumberOrNull(v: string): number | null {
  return (v ?? "").trim() ? toNumber(v) : null;
}
