import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "vote_session";

async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  cookieStore.set(COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  return id;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reviewId = Number(body.review_id);
    const vote = Number(body.vote);

    if (!reviewId || (vote !== 1 && vote !== -1)) {
      return NextResponse.json(
        { error: "Invalid review_id or vote (must be 1 or -1)" },
        { status: 400 }
      );
    }

    const sessionId = await getOrCreateSession();
    const supabase = await createClient();

    // Check for existing vote
    const { data: existing } = await supabase
      .from("review_votes")
      .select("id, vote")
      .eq("review_id", reviewId)
      .eq("session_id", sessionId)
      .single();

    if (existing) {
      if (existing.vote === vote) {
        // Same vote again → remove it (toggle off)
        await supabase.from("review_votes").delete().eq("id", existing.id);
      } else {
        // Different vote → update
        await supabase
          .from("review_votes")
          .update({ vote })
          .eq("id", existing.id);
      }
    } else {
      // New vote
      const { error } = await supabase.from("review_votes").insert({
        review_id: reviewId,
        session_id: sessionId,
        vote,
      });
      if (error) throw error;
    }

    // Return updated score
    const { data: votes } = await supabase
      .from("review_votes")
      .select("vote")
      .eq("review_id", reviewId);

    const score = (votes ?? []).reduce(
      (sum: number, v: { vote: number }) => sum + v.vote,
      0
    );

    return NextResponse.json({ success: true, score });
  } catch {
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}
