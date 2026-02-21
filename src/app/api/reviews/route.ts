import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { game_id, author, email, body: reviewBody, stars } = body;

    if (!game_id || !author || !reviewBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (reviewBody.length < 20) {
      return NextResponse.json({ error: "Review is too short" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from("reviews").insert({
      game_id: Number(game_id),
      author: author.trim(),
      email: email?.trim() || null,
      body: reviewBody.trim(),
      stars: stars ? Number(stars) : null,
      status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
