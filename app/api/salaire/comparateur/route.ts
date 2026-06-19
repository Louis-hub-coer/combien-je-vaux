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

const shortCategory = (r: { type: string; category: string; subCategory: string }) =>
  broadCategory({ type: r.type, category: r.category, subCategory: r.subCategory } as SearchResultItem);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const annual = Number(searchParams.get("annual"));
  if (!Number.isFinite(annual) || annual <= 0) {
    return NextResponse.json({ error: "bad_annual" }, { status: 400 });
  }

  try {
    const { records } = await getDataset();

    // 1) Un profil UNIQUE par nom affiché, avec un salaire représentatif
    //    (ligne par défaut, sinon priorité la plus élevée).
    const byName = new Map<string, { rec: (typeof records)[number]; salary: number }>();
    for (const r of records) {
      const s = r.salaryTotalEur;
      if (!r.displayName || s == null || !(s > 0)) continue;
      const prev = byName.get(r.displayName);
      if (!prev) {
        byName.set(r.displayName, { rec: r, salary: s });
        continue;
      }
      const better =
        (r.isDefault && !prev.rec.isDefault) ||
        (r.isDefault === prev.rec.isDefault && r.priority > prev.rec.priority);
      if (better) byName.set(r.displayName, { rec: r, salary: s });
    }

    const profiles: Profile[] = [];
    for (const { rec, salary } of byName.values()) {
      profiles.push({
        name: rec.displayName,
        slug: rec.slug,
        salary,
        diff: salary - annual,
        category: shortCategory(rec),
        isPerson: rec.isPerson,
      });
    }
    if (!profiles.length) {
      return NextResponse.json({ annual, jumeau: null, near: [], above: [], below: [] });
    }

    // 2) Jumeau : profil le plus proche en valeur absolue.
    const byAbs = [...profiles].sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));
    const jumeau = byAbs[0];

    // 3) « Ils gagnent comme vous » : proches et variés (max 2 par catégorie).
    const near: Profile[] = [];
    const catCount: Record<string, number> = {};
    for (const p of byAbs) {
      if (p.name === jumeau.name) continue;
      const c = catCount[p.category] ?? 0;
      if (c >= 2) continue;
      catCount[p.category] = c + 1;
      near.push(p);
      if (near.length >= 5) break;
    }
    // Glisser une personnalité proche si aucune n'est présente.
    if (!near.some((p) => p.isPerson)) {
      const person = byAbs.find((p) => p.isPerson && p.name !== jumeau.name);
      if (person && near.length) near[near.length - 1] = person;
    }

    // 4) Juste au-dessus / juste en dessous (les plus proches de part et d'autre).
    const above = profiles.filter((p) => p.diff > 0 && p.name !== jumeau.name).sort((a, b) => a.diff - b.diff).slice(0, 3);
    const below = profiles.filter((p) => p.diff < 0 && p.name !== jumeau.name).sort((a, b) => b.diff - a.diff).slice(0, 3);

    return NextResponse.json(
      { annual, jumeau, near, above, below },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" } },
    );
  } catch (e) {
    console.error("[/api/salaire/comparateur]", e);
    return NextResponse.json({ error: "compare_failed" }, { status: 500 });
  }
}
