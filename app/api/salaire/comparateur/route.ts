import { NextResponse, type NextRequest } from "next/server";
import { getDataset } from "@/lib/search/dataset";
import { broadCategory } from "@/lib/display";
import type { SearchResultItem } from "@/types/search";

// Lecture du CSV via fs -> runtime Node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Profile {
  name: string;
  slug: string;
  salary: number;
  diff: number; // salaire du profil − revenu de l'utilisateur
  category: string;
  isPerson: boolean;
}

const norm = (s: string) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const STRONG_PERSONS = [
  "mbappe", "cristiano ronaldo", "ronaldo", "messi", "neymar", "benzema", "griezmann", "zidane",
  "haaland", "lewandowski", "pogba", "de bruyne", "ribery", "giroud",
  "mrbeast", "squeezie", "ishowspeed", "michou", "inoxtag", "lena", "tibo inshape", "gotaga",
  "aya nakamura", "jul", "booba", "orelsan", "ninho", "gims", "soprano", "pnl", "damso", "niska",
  "beyonce", "rihanna", "drake", "taylor swift", "kanye", "the weeknd",
  "kim kardashian", "kylie jenner", "elon musk", "bernard arnault", "xavier niel", "omar sy", "dujardin",
];
const STRONG_JOBS = [
  "data scientist", "avocat", "pharmacien", "medecin", "infirmier", "infirmiere", "trader", "boulanger",
  "professeur", "enseignant", "pilote", "commercial", "dentiste", "comptable", "developpeur", "ingenieur",
  "notaire", "architecte", "kine", "kinesitherapeute", "veterinaire", "chirurgien", "plombier",
  "electricien", "policier", "pompier", "journaliste", "banquier", "consultant", "agriculteur", "expert-comptable",
];
const PRIORITY_CUTOFF = 82;

const shortCategory = (r: { type: string; category: string; subCategory: string }) =>
  broadCategory({ type: r.type, category: r.category, subCategory: r.subCategory } as SearchResultItem);

function isInteresting(r: { displayName: string; isPerson: boolean; priority: number }): boolean {
  const n = norm(r.displayName);
  if (r.isPerson) return STRONG_PERSONS.some((p) => n.includes(p));
  return r.priority >= PRIORITY_CUTOFF || STRONG_JOBS.some((j) => n.includes(j));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const annualRaw = Number(searchParams.get("annual"));
  const annual = Number.isFinite(annualRaw) && annualRaw > 0 ? annualRaw : null;
  const target = searchParams.get("target"); // url_slug d'une fiche /salaires

  if (annual == null && !target) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const { records } = await getDataset();

    // Un profil unique par nom, salaire représentatif (ligne par défaut / priorité).
    const byName = new Map<string, (typeof records)[number]>();
    for (const r of records) {
      const s = r.salaryTotalEur;
      if (!r.displayName || s == null || !(s > 0)) continue;
      const prev = byName.get(r.displayName);
      if (!prev) { byName.set(r.displayName, r); continue; }
      const better = (r.isDefault && !prev.isDefault) || (r.isDefault === prev.isDefault && r.priority > prev.priority);
      if (better) byName.set(r.displayName, r);
    }

    // Référence à partir d'un slug (fiche consultée).
    let reference: Profile | null = null;
    if (target) {
      const matches = records.filter((r) => r.slug === target && r.salaryTotalEur != null && (r.salaryTotalEur as number) > 0);
      if (matches.length) {
        matches.sort((a, b) => (Number(b.isDefault) - Number(a.isDefault)) || (b.priority - a.priority));
        const r = matches[0];
        reference = {
          name: r.displayName,
          slug: r.slug,
          salary: r.salaryTotalEur as number,
          diff: annual != null ? (r.salaryTotalEur as number) - annual : 0,
          category: shortCategory(r),
          isPerson: r.isPerson,
        };
      }
    }

    if (annual == null) {
      // Pré-chargement de la référence uniquement (avant saisie du salaire).
      return NextResponse.json({ annual: null, reference, between: { below: null, above: null }, listBelow: [], listAbove: [] });
    }

    const pool: Profile[] = [];
    for (const r of byName.values()) {
      if (!isInteresting(r)) continue;
      pool.push({
        name: r.displayName,
        slug: r.slug,
        salary: r.salaryTotalEur as number,
        diff: (r.salaryTotalEur as number) - annual,
        category: shortCategory(r),
        isPerson: r.isPerson,
      });
    }

    const below = pool.filter((p) => p.diff < 0).sort((a, b) => b.diff - a.diff);
    const above = pool.filter((p) => p.diff > 0).sort((a, b) => a.diff - b.diff);

    return NextResponse.json(
      {
        annual,
        reference,
        between: { below: below[0] ?? null, above: above[0] ?? null },
        listBelow: below.slice(0, 3),
        listAbove: above.slice(0, 3),
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } },
    );
  } catch (e) {
    console.error("[/api/salaire/comparateur]", e);
    return NextResponse.json({ error: "compare_failed" }, { status: 500 });
  }
}
