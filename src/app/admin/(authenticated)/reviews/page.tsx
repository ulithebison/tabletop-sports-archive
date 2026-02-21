import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { Review } from "@/lib/types";
import { Star, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reviews",
};

// ----------------------------------------------------------------
// Server Actions
// ----------------------------------------------------------------

async function approveReview(id: number) {
  "use server";
  const supabase = await createClient();
  await supabase.from("reviews").update({ status: "approved" }).eq("id", id);
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
}

async function rejectReview(id: number) {
  "use server";
  const supabase = await createClient();
  await supabase.from("reviews").update({ status: "rejected" }).eq("id", id);
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StarRating({ stars }: { stars: number | null }) {
  if (stars == null) {
    return (
      <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
        —
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span
        className="font-mono text-sm font-medium"
        style={{ color: "var(--raw-gold-450)" }}
      >
        {stars}
      </span>
      <span style={{ color: "var(--raw-gold-450)", fontSize: "0.7rem" }}>
        {"★".repeat(stars)}
        <span style={{ color: "var(--color-border-default)" }}>
          {"★".repeat(5 - stars)}
        </span>
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: Review["status"] }) {
  const styles: Record<Review["status"], { bg: string; color: string; border: string }> = {
    pending: {
      bg: "rgba(212,168,67,0.12)",
      color: "var(--raw-gold-300)",
      border: "1px solid rgba(212,168,67,0.3)",
    },
    approved: {
      bg: "rgba(77,132,100,0.12)",
      color: "var(--raw-green-300)",
      border: "1px solid rgba(77,132,100,0.3)",
    },
    rejected: {
      bg: "rgba(196,75,59,0.12)",
      color: "var(--raw-red-300)",
      border: "1px solid rgba(196,75,59,0.3)",
    },
  };
  const s = styles[status];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium uppercase"
      style={{ background: s.bg, color: s.color, border: s.border }}
    >
      {status}
    </span>
  );
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  const { data, count } = await supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const reviews: Review[] = (data ?? []) as Review[];
  const total = count ?? 0;

  return (
    <div
      className="min-h-screen px-5 py-10"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="accent-rule" />
              <span className="section-label">Moderation</span>
            </div>
            <h1
              className="font-heading font-bold text-3xl uppercase tracking-wide"
              style={{ color: "var(--color-text-primary)" }}
            >
              Pending Reviews
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span
                className="font-mono"
                style={{ color: "var(--color-text-accent)" }}
              >
                {total}
              </span>{" "}
              {total === 1 ? "review" : "reviews"} awaiting moderation
            </p>
          </div>
          <div
            className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
            style={{ background: "rgba(232,133,26,0.1)" }}
          >
            <Star size={20} style={{ color: "var(--raw-amber-400)" }} />
          </div>
        </div>

        {/* Empty state */}
        {reviews.length === 0 ? (
          <div
            className="rounded-lg flex flex-col items-center justify-center py-24 gap-4"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <Inbox
              size={48}
              style={{ color: "var(--color-text-faint)", opacity: 0.4 }}
            />
            <div className="text-center">
              <h2
                className="font-heading font-semibold text-lg uppercase tracking-wide"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Queue is empty
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-text-faint)" }}
              >
                No pending reviews at this time.
              </p>
            </div>
          </div>
        ) : (
          /* Table */
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Amber top accent */}
            <div
              className="h-0.5"
              style={{ background: "var(--raw-amber-400)" }}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {[
                      "Author",
                      "Game",
                      "Stars",
                      "Review",
                      "Date",
                      "Status",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left font-heading text-xs uppercase tracking-widest whitespace-nowrap"
                        style={{ color: "var(--color-text-accent)" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review, idx) => (
                    <tr
                      key={review.id}
                      style={{
                        borderBottom:
                          idx < reviews.length - 1
                            ? "1px solid var(--color-border-faint)"
                            : "none",
                        background:
                          idx % 2 === 1
                            ? "rgba(255,255,255,0.015)"
                            : "transparent",
                      }}
                    >
                      {/* Author */}
                      <td className="px-4 py-3">
                        <div
                          className="font-heading font-semibold text-sm"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {review.author}
                        </div>
                        {review.email && (
                          <div
                            className="text-xs mt-0.5 font-mono truncate max-w-[160px]"
                            style={{ color: "var(--color-text-faint)" }}
                          >
                            {review.email}
                          </div>
                        )}
                      </td>

                      {/* Game */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/games/${review.game_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs transition-colors"
                          style={{ color: "var(--color-text-link)" }}
                        >
                          #{review.game_id}
                        </Link>
                      </td>

                      {/* Stars */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StarRating stars={review.stars} />
                      </td>

                      {/* Review body excerpt */}
                      <td className="px-4 py-3 max-w-xs">
                        <p
                          className="text-xs leading-relaxed line-clamp-2"
                          style={{
                            color: "var(--color-text-muted)",
                            fontFamily: "var(--font-lora)",
                          }}
                        >
                          {review.body}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--color-text-faint)" }}
                        >
                          {formatDate(review.created_at)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={review.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* Approve */}
                          <form
                            action={async () => {
                              "use server";
                              await approveReview(review.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="px-3 py-1 rounded text-xs font-heading font-semibold uppercase tracking-wide transition-all"
                              style={{
                                background: "rgba(77,132,100,0.14)",
                                border: "1px solid rgba(77,132,100,0.3)",
                                color: "var(--raw-green-300)",
                              }}
                            >
                              Approve
                            </button>
                          </form>

                          {/* Reject */}
                          <form
                            action={async () => {
                              "use server";
                              await rejectReview(review.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="px-3 py-1 rounded text-xs font-heading font-semibold uppercase tracking-wide transition-all"
                              style={{
                                background: "rgba(196,75,59,0.12)",
                                border: "1px solid rgba(196,75,59,0.3)",
                                color: "var(--raw-red-300)",
                              }}
                            >
                              Reject
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div
              className="px-4 py-3 flex items-center justify-between border-t"
              style={{ borderColor: "var(--color-border-faint)" }}
            >
              <span
                className="text-xs font-mono"
                style={{ color: "var(--color-text-faint)" }}
              >
                {total} pending {total === 1 ? "review" : "reviews"}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-faint)" }}
              >
                Showing all pending
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
