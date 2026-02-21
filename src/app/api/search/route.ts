import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const limitParam = parseInt(
      request.nextUrl.searchParams.get("limit") ?? "8",
      10
    );
    const limit = Math.max(1, Math.min(20, isNaN(limitParam) ? 8 : limitParam));

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchGames(q, limit);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
