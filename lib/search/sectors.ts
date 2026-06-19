import "server-only";
import { getDataset, type IndexedRecord } from "./dataset";
import { normalizeText } from "./normalize";
import { broadCategory } from "../display";
import type { SearchResultItem } from "../../types/search";

export interface SectorItem {
  name: string;       // titre générique (nom du métier)
  sub: string;        // sous-titre générique (catégorie large)
  total: number | null;
}
export interface SectorOverview {
  key: string;
  label: string;
  top: SectorItem[];        // 5 mieux rémunérés
  popular: SectorItem[];    // métiers les plus recherchés (priority)
  accessible: SectorItem[]; // métiers grand public / accessibles
  stat: { medianEur: number | null; topName: string; popularName: string; count: number };
}

// Définition des secteurs : prédicat sur la VRAIE colonne `categorie` (pas inventé).
const SECTORS: { key: string; label: string; re: RegExp }[] = [
  { key: "finance", label: "Finance", re: /finance|banqu|assuran/ },
  { key: "tech", label: "Tech / Data", re: /tech|informat/ },
  { key: "sante", label: "Santé", re: /sante|medical/ },
  { key: "droit", label: "Droit", re: /droit|justice/ },
  { key: "conseil", label: "Conseil", re: /conseil|audit/ },
  { key: "marketing", label: "Marketing", re: /marketing|communicat|digital/ },
  { key: "immobilier", label: "Immobilier", re: /immobil/ },
  { key: "industrie", label: "Industrie / ingénierie", re: /industrie|production/ },
  { key: "sport", label: "Sport", re: /\bsport\b/ },
  { key: "public", label: "Fonction publique", re: /fonction publique|securite|defense|police|armee|gendarm/ },
];

export const SECTOR_KEYS = SECTORS.map((s) => s.key);

const asItem = (r: IndexedRecord): SectorItem => ({
  name: r.displayName,
  sub: broadCategory({ type: r.type, category: r.category, subCategory: r.subCategory } as SearchResultItem),
  total: r.salaryTotalEur,
});

export async function sectorOverview(key: string): Promise<SectorOverview | null> {
  const sec = SECTORS.find((s) => s.key === key);
  if (!sec) return null;
  const { records } = await getDataset();

  // 1) métiers du secteur (pas de personnes), salaire connu
  const pool = records.filter(
    (r) => r.type !== "personne_nom" && r.salaryTotalEur != null && sec.re.test(normalizeText(r.category)),
  );

  // 2) un représentant par métier (ligne is_default sinon première rencontrée)
  const byFam = new Map<string, IndexedRecord>();
  for (const r of pool) {
    const fam = normalizeText(r.job || r.displayName);
    const cur = byFam.get(fam);
    if (!cur || (r.isDefault && !cur.isDefault)) byFam.set(fam, r);
  }
  const metiers = [...byFam.values()];
  if (!metiers.length) {
    return { key: sec.key, label: sec.label, top: [], popular: [], accessible: [], stat: { medianEur: null, topName: "", popularName: "", count: 0 } };
  }

  const sal = (r: IndexedRecord) => r.salaryTotalEur ?? 0;

  const top = [...metiers].sort((a, b) => sal(b) - sal(a)).slice(0, 5);
  const topIds = new Set(top.map((r) => r.id));

  const popular = [...metiers]
    .filter((r) => !topIds.has(r.id))
    .sort((a, b) => b.priority - a.priority || sal(b) - sal(a))
    .slice(0, 5);
  const usedIds = new Set([...topIds, ...popular.map((r) => r.id)]);

  const accessible = [...metiers]
    .filter((r) => !usedIds.has(r.id))
    .sort((a, b) => sal(a) - sal(b))
    .slice(0, 5);

  const sorted = metiers.map(sal).sort((a, b) => a - b);
  const medianEur = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;

  return {
    key: sec.key,
    label: sec.label,
    top: top.map(asItem),
    popular: popular.map(asItem),
    accessible: accessible.map(asItem),
    stat: {
      medianEur,
      topName: top[0]?.displayName ?? "",
      popularName: popular[0]?.displayName ?? "",
      count: metiers.length,
    },
  };
}
