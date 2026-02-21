import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// In-memory rate limit store (resets on server restart — fine for serverless)
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 5;

function getClientIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { game_id, author, body: commentBody, _hp, _t } = body;

    // Honeypot check — silently "succeed" to avoid tipping off bots
    if (_hp) {
      return NextResponse.json({ success: true });
    }

    // Time check — reject if submitted < 2 seconds after form rendered
    if (typeof _t === "number" && Date.now() - _t < 2000) {
      return NextResponse.json(
        { error: "Please wait a moment before submitting." },
        { status: 400 }
      );
    }

    // IP-based rate limit
    const ip = getClientIP(req);
    const now = Date.now();
    const entry = rateLimit.get(ip);

    if (entry) {
      if (now < entry.resetAt) {
        if (entry.count >= RATE_LIMIT_MAX) {
          return NextResponse.json(
            { error: "Too many comments. Please wait a few minutes." },
            { status: 429 }
          );
        }
        entry.count++;
      } else {
        // Window expired — reset
        rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    }

    if (!game_id || !author || !commentBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof author !== "string" || author.trim().length < 1) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (typeof commentBody !== "string" || commentBody.trim().length < 3) {
      return NextResponse.json({ error: "Comment is too short" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("comments")
      .insert({
        game_id: Number(game_id),
        author: author.trim(),
        body: commentBody.trim(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to submit comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true, comment: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
