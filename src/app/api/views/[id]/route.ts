import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gameId = Number(id);

  if (isNaN(gameId)) {
    return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Upsert view count
    const { data: existing } = await supabase
      .from("game_views")
      .select("view_count")
      .eq("game_id", gameId)
      .single();

    if (existing) {
      await supabase
        .from("game_views")
        .update({ view_count: existing.view_count + 1 })
        .eq("game_id", gameId);
    } else {
      await supabase.from("game_views").insert({ game_id: gameId, view_count: 1 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
