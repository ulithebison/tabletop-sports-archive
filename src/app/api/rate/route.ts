import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { game_id, stars } = body;

    if (!game_id || !stars || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Get or create session ID from cookie
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("rating_session")?.value;
    if (!sessionId) {
      sessionId = randomUUID();
    }

    const supabase = await createClient();

    // Check if already rated from this session
    const { data: existing } = await supabase
      .from("ratings")
      .select("id")
      .eq("game_id", game_id)
      .eq("session_id", sessionId)
      .single();

    if (existing) {
      // Update existing rating
      await supabase
        .from("ratings")
        .update({ stars })
        .eq("game_id", game_id)
        .eq("session_id", sessionId);
    } else {
      // Insert new rating
      await supabase
        .from("ratings")
        .insert({ game_id, session_id: sessionId, stars });
    }

    // Get updated average
    const { data: allRatings } = await supabase
      .from("ratings")
      .select("stars")
      .eq("game_id", game_id);

    const count = allRatings?.length ?? 0;
    const sum = allRatings?.reduce((acc, r) => acc + r.stars, 0) ?? 0;
    const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

    const response = NextResponse.json({ success: true, avg, count });

    // Set session cookie (1 year)
    response.cookies.set("rating_session", sessionId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
  }
}
