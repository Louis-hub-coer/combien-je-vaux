import { NextResponse, type NextRequest } from "next/server";
import { getDataset } from "@/lib/search/dataset";
import { broadCategory } from "@/lib/display";
import type { SearchResultItem } from "@/types/search";

// Lecture du CSV via fs -> runtime Node. Réponse dépendante de ?annual.
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

// Personnalités connues (le résultat principal doit rester « parlant »).
const STRONG_PERSONS = [
  "mbappe", "cristiano ronaldo", "ronaldo", "messi", "neymar", "benzema", "griezmann", "zidane",
  "haaland", "lewandowski", "pogba", "de bruyne", "ribery", "giroud",
  "mrbeast", "squeezie", "ishowspeed", "michou", "inoxtag", "lena", "tibo inshape", "gotaga", "squeeze",
  "aya nakamura", "jul", "booba", "orelsan", "ninho", "gims", "soprano", "pnl", "damso", "niska",
  "beyonce", "rihanna", "drake", "taylor swift", "kanye", "the weeknd",
  "kim kardashian", "kylie jenner", "elon musk", "bernard arnault", "xavier niel", "omar sy", "dujardin",
];
// Métiers forts / parlants (toujours admissibles, même priorité moyenne).
const STRONG_JOBS = [
  "data scientist", "avocat", "pharmacien", "medecin", "infirmier", "infirmiere", "trader", "boulanger",
  "professeur", "enseignant", "pilote", "commercial", "dentiste", "comptable", "developpeur", "ingenieur",
  "notaire", "architecte", "kine", "kinesitherapeute", "veterinaire", "chirurgien", "plombier",
  "electricien", "policier", "pompier", "journaliste", "banquier", "consultant", "agriculteur", "expert-comptable",
];
const PRIORITY_CUTOFF = 82;

const shortCategory = (r: { type: string; category: string; subCategory: string }) =>
  broadCategory({ type: r.type, category: r.category, subCategory: r.subCategory } as SearchResultItem);

/** Profil « parlant » : personnalité connue, ou métier populaire / à priorité suffisante. */
function isInteresting(r: { displayName: string; isPerson: boolean; priority: number }): boolean {
  const n = norm(r.displayName);
  if (r.isPerson) return STRONG_PERSONS.some((p) => n.includes(p));
  return r.priority >= PRIORITY_CUTOFF || STRONG_JOBS.some((j) => n.includes(j));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const annual = Number(searchParams.get("annual"));
  if (!Number.isFinite(annual) || annual <= 0) {
    return NextResponse.json({ error: "bad_annual" }, { status: 400 });
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

    // Pool « parlant » seulement (filtre les métiers obscurs et les personnalités inconnues).
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

    const below = pool.filter((p) => p.diff < 0).sort((a, b) => b.diff - a.diff); // plus proches d'abord (diff ↑ vers 0)
    const above = pool.filter((p) => p.diff >= 0).sort((a, b) => a.diff - b.diff); // plus proches d'abord

    return NextResponse.json(
      {
        annual,
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
