import { NextResponse, type NextRequest } from "next/server";
import { getDataset } from "@/lib/search/dataset";
import { broadCategory } from "@/lib/display";
import type { SearchResultItem } from "@/types/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const norm = (s: string) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

interface Item { name: string; slug: string; salary: number; category: string; isPerson: boolean }
let CACHE: Item[] | null = null;

async function buildIndex(): Promise<Item[]> {
  if (CACHE) return CACHE;
  const { records } = await getDataset();
  const byName = new Map<string, (typeof records)[number]>();
  for (const r of records) {
    const s = r.salaryTotalEur;
    if (!r.displayName || s == null || !(s > 0)) continue;
    const prev = byName.get(r.displayName);
    if (!prev) { byName.set(r.displayName, r); continue; }
    const better = (r.isDefault && !prev.isDefault) || (r.isDefault === prev.isDefault && r.priority > prev.priority);
    if (better) byName.set(r.displayName, r);
  }
  CACHE = [...byName.values()].map((r) => ({
    name: r.displayName,
    slug: r.slug,
    salary: r.salaryTotalEur as number,
    category: broadCategory({ type: r.type, category: r.category, subCategory: r.subCategory } as SearchResultItem),
    isPerson: r.isPerson,
  }));
  return CACHE;
}

export async function GET(req: NextRequest) {
  const q = norm(new URL(req.url).searchParams.get("q") ?? "");
  if (q.length < 2) return NextResponse.json({ items: [] });
  try {
    const index = await buildIndex();
    const scored: { it: Item; rank: number }[] = [];
    for (const it of index) {
      const n = norm(it.name);
      if (n.startsWith(q)) scored.push({ it, rank: 0 });
      else if (n.split(/[\s/(),'-]+/).some((w) => w.startsWith(q))) scored.push({ it, rank: 1 });
      else if (n.includes(q)) scored.push({ it, rank: 2 });
    }
    scored.sort((a, b) => a.rank - b.rank || a.it.name.length - b.it.name.length || a.it.name.localeCompare(b.it.name));
    return NextResponse.json({ items: scored.slice(0, 8).map((s) => s.it) }, { headers: { "Cache-Control": "public, s-maxage=600" } });
  } catch (e) {
    console.error("[comparateur/suggest]", e);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
