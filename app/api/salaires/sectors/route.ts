import { NextResponse, type NextRequest } from "next/server";
import { sectorOverview } from "@/lib/search/sectors";

// Lecture de l'index via fs -> runtime Node (pas Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key") ?? "";
  try {
    const data = await sectorOverview(key);
    if (!data) return NextResponse.json({ error: "unknown_sector" }, { status: 404 });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (e) {
    console.error("[/api/salaires/sectors]", e);
    return NextResponse.json({ error: "sector_failed" }, { status: 500 });
  }
}
