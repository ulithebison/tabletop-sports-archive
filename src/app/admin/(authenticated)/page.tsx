import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Gamepad2, Star, ArrowRight, Clock, MessageCircle, Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
};

async function getQueueCounts() {
  const supabase = await createClient();

  const [{ count: pendingGames }, { count: pendingReviews }, { count: totalComments }] =
    await Promise.all([
      supabase
        .from("game_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("comments")
        .select("*", { count: "exact", head: true }),
    ]);

  return {
    pendingGames: pendingGames ?? 0,
    pendingReviews: pendingReviews ?? 0,
    totalComments: totalComments ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const { pendingGames, pendingReviews, totalComments } = await getQueueCounts();

  const totalPending = pendingGames + pendingReviews;

  return (
    <div
      className="min-h-screen px-5 py-10"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div className="max-w-[1000px] mx-auto">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="accent-rule" />
            <span className="section-label">Overview</span>
          </div>
          <h1
            className="font-heading font-bold text-3xl uppercase tracking-wide"
            style={{ color: "var(--color-text-primary)" }}
          >
            Dashboard
          </h1>
          {totalPending > 0 ? (
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span
                className="font-mono"
                style={{ color: "var(--color-text-accent)" }}
              >
                {totalPending}
              </span>{" "}
              {totalPending === 1 ? "item" : "items"} awaiting review
            </p>
          ) : (
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              All queues are clear.
            </p>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {/* Game Submissions */}
          <Link
            href="/admin/games"
            className="group rounded-lg p-6 flex flex-col gap-4 transition-all"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderTopWidth: "2px",
              borderTopColor:
                pendingGames > 0
                  ? "var(--color-accent-primary)"
                  : "var(--color-border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded flex items-center justify-center"
                style={{ background: "rgba(212,168,67,0.1)" }}
              >
                <Gamepad2 size={20} style={{ color: "var(--raw-gold-450)" }} />
              </div>
              {pendingGames > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-mono font-medium"
                  style={{
                    background: "rgba(212,168,67,0.15)",
                    color: "var(--color-text-accent)",
                    border: "1px solid rgba(212,168,67,0.3)",
                  }}
                >
                  {pendingGames} pending
                </span>
              )}
            </div>
            <div>
              <div
                className="font-mono text-4xl font-medium tabular-nums"
                style={{ color: "var(--color-text-primary)" }}
              >
                {pendingGames}
              </div>
              <div
                className="font-heading text-sm uppercase tracking-widest mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Game Submissions
              </div>
            </div>
            <div
              className="flex items-center gap-1 text-xs font-heading uppercase tracking-wide transition-colors"
              style={{ color: "var(--color-text-faint)" }}
            >
              Review queue
              <ArrowRight
                size={12}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>

          {/* Reviews */}
          <Link
            href="/admin/reviews"
            className="group rounded-lg p-6 flex flex-col gap-4 transition-all"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderTopWidth: "2px",
              borderTopColor:
                pendingReviews > 0
                  ? "var(--raw-amber-400)"
                  : "var(--color-border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded flex items-center justify-center"
                style={{ background: "rgba(232,133,26,0.1)" }}
              >
                <Star size={20} style={{ color: "var(--raw-amber-400)" }} />
              </div>
              {pendingReviews > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-mono font-medium"
                  style={{
                    background: "rgba(232,133,26,0.15)",
                    color: "var(--raw-amber-350)",
                    border: "1px solid rgba(232,133,26,0.3)",
                  }}
                >
                  {pendingReviews} pending
                </span>
              )}
            </div>
            <div>
              <div
                className="font-mono text-4xl font-medium tabular-nums"
                style={{ color: "var(--color-text-primary)" }}
              >
                {pendingReviews}
              </div>
              <div
                className="font-heading text-sm uppercase tracking-widest mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Pending Reviews
              </div>
            </div>
            <div
              className="flex items-center gap-1 text-xs font-heading uppercase tracking-wide transition-colors"
              style={{ color: "var(--color-text-faint)" }}
            >
              Review queue
              <ArrowRight
                size={12}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>

          {/* Comments */}
          <Link
            href="/admin/comments"
            className="group rounded-lg p-6 flex flex-col gap-4 transition-all"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderTopWidth: "2px",
              borderTopColor: "var(--raw-blue-400)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded flex items-center justify-center"
                style={{ background: "rgba(74,132,184,0.1)" }}
              >
                <MessageCircle size={20} style={{ color: "var(--raw-blue-400)" }} />
              </div>
            </div>
            <div>
              <div
                className="font-mono text-4xl font-medium tabular-nums"
                style={{ color: "var(--color-text-primary)" }}
              >
                {totalComments}
              </div>
              <div
                className="font-heading text-sm uppercase tracking-widest mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Comments
              </div>
            </div>
            <div
              className="flex items-center gap-1 text-xs font-heading uppercase tracking-wide transition-colors"
              style={{ color: "var(--color-text-faint)" }}
            >
              Manage comments
              <ArrowRight
                size={12}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>
        </div>

        {/* Quick links */}
        <section
          className="rounded-lg p-6"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <h2
            className="font-heading font-semibold text-base uppercase tracking-widest mb-5"
            style={{ color: "var(--color-text-accent)" }}
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/admin/games"
              className="group flex items-center gap-3 p-4 rounded transition-colors"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-faint)",
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(212,168,67,0.1)" }}
              >
                <Gamepad2 size={16} style={{ color: "var(--raw-gold-450)" }} />
              </div>
              <div>
                <div
                  className="font-heading text-sm font-semibold uppercase tracking-wide group-hover:text-gold-400 transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Manage Game Submissions
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  Approve or reject community submissions
                </div>
              </div>
              <ArrowRight
                size={14}
                className="ml-auto opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all"
                style={{ color: "var(--color-text-muted)" }}
              />
            </Link>

            <Link
              href="/admin/reviews"
              className="group flex items-center gap-3 p-4 rounded transition-colors"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-faint)",
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(232,133,26,0.1)" }}
              >
                <Star size={16} style={{ color: "var(--raw-amber-400)" }} />
              </div>
              <div>
                <div
                  className="font-heading text-sm font-semibold uppercase tracking-wide group-hover:text-gold-400 transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Moderate Reviews
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  Approve or reject community reviews
                </div>
              </div>
              <ArrowRight
                size={14}
                className="ml-auto opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all"
                style={{ color: "var(--color-text-muted)" }}
              />
            </Link>

            <Link
              href="/admin/comments"
              className="group flex items-center gap-3 p-4 rounded transition-colors"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-faint)",
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(74,132,184,0.1)" }}
              >
                <MessageCircle size={16} style={{ color: "var(--raw-blue-400)" }} />
              </div>
              <div>
                <div
                  className="font-heading text-sm font-semibold uppercase tracking-wide group-hover:text-gold-400 transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Manage Comments
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  Delete inappropriate comments
                </div>
              </div>
              <ArrowRight
                size={14}
                className="ml-auto opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all"
                style={{ color: "var(--color-text-muted)" }}
              />
            </Link>

            <Link
              href="/admin/news"
              className="group flex items-center gap-3 p-4 rounded transition-colors"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-faint)",
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(77,132,100,0.1)" }}
              >
                <Newspaper size={16} style={{ color: "var(--raw-green-300)" }} />
              </div>
              <div>
                <div
                  className="font-heading text-sm font-semibold uppercase tracking-wide group-hover:text-gold-400 transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Manage News
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  Create or remove announcements
                </div>
              </div>
              <ArrowRight
                size={14}
                className="ml-auto opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all"
                style={{ color: "var(--color-text-muted)" }}
              />
            </Link>

            <Link
              href="/games"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-4 rounded transition-colors"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-faint)",
              }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(74,132,184,0.1)" }}
              >
                <Clock size={16} style={{ color: "var(--raw-blue-400)" }} />
              </div>
              <div>
                <div
                  className="font-heading text-sm font-semibold uppercase tracking-wide group-hover:text-gold-400 transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  View Public Archive
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-faint)" }}
                >
                  Open the live site in a new tab
                </div>
              </div>
              <ArrowRight
                size={14}
                className="ml-auto opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all"
                style={{ color: "var(--color-text-muted)" }}
              />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
