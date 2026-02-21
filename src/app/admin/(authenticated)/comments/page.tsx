import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { Comment } from "@/lib/types";
import { MessageCircle, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comments",
};

// ----------------------------------------------------------------
// Server Actions
// ----------------------------------------------------------------

async function deleteComment(id: number) {
  "use server";
  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", id);
  revalidatePath("/admin/comments");
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

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function AdminCommentsPage() {
  const supabase = await createClient();

  const { data, count } = await supabase
    .from("comments")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  const comments: Comment[] = (data ?? []) as Comment[];
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
              Comments
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
              total {total === 1 ? "comment" : "comments"}
            </p>
          </div>
          <div
            className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
            style={{ background: "rgba(74,132,184,0.1)" }}
          >
            <MessageCircle size={20} style={{ color: "var(--raw-blue-400)" }} />
          </div>
        </div>

        {/* Empty state */}
        {comments.length === 0 ? (
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
                No comments yet
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-text-faint)" }}
              >
                Comments will appear here when users post on game pages.
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
            {/* Blue top accent */}
            <div
              className="h-0.5"
              style={{ background: "var(--raw-blue-400)" }}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {["Author", "Game", "Comment", "Date", "Actions"].map(
                      (col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left font-heading text-xs uppercase tracking-widest whitespace-nowrap"
                          style={{ color: "var(--color-text-accent)" }}
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {comments.map((comment, idx) => (
                    <tr
                      key={comment.id}
                      style={{
                        borderBottom:
                          idx < comments.length - 1
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
                          {comment.author}
                        </div>
                      </td>

                      {/* Game */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/games/${comment.game_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs transition-colors"
                          style={{ color: "var(--color-text-link)" }}
                        >
                          #{comment.game_id}
                        </Link>
                      </td>

                      {/* Comment body excerpt */}
                      <td className="px-4 py-3 max-w-xs">
                        <p
                          className="text-xs leading-relaxed line-clamp-2"
                          style={{
                            color: "var(--color-text-muted)",
                            fontFamily: "var(--font-lora)",
                          }}
                        >
                          {comment.body}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--color-text-faint)" }}
                        >
                          {formatDate(comment.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <form
                          action={async () => {
                            "use server";
                            await deleteComment(comment.id);
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
                            Delete
                          </button>
                        </form>
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
                {total} {total === 1 ? "comment" : "comments"}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-faint)" }}
              >
                Showing all
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
