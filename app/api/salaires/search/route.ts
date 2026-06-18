import { NextResponse, type NextRequest } from "next/server";
import { searchSalaries } from "@/lib/search/search";

// Lecture du CSV via fs -> runtime Node obligatoire (pas Edge).
export const runtime = "nodejs";
// Réponse dépendante de ?q : pas de pré-rendu statique.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limitRaw = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;

  try {
    const data = await searchSalaries({ q, limit });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
    });
  } catch (e) {
    console.error("[/api/salaires/search]", e);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
