import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { GameSubmission } from "@/lib/types";
import { Gamepad2, Inbox } from "lucide-react";
import { SubmissionActions } from "@/components/admin/EditSubmissionDialog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Game Submissions",
};

// ----------------------------------------------------------------
// Server Actions
// ----------------------------------------------------------------

async function approveSubmission(id: number) {
  "use server";
  const supabase = await createClient();

  // 1. Fetch the full submission
  const { data: submission, error: fetchError } = await supabase
    .from("game_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !submission) {
    console.error("Failed to fetch submission:", fetchError);
    return;
  }

  // 2. Guard against double-approval
  if (submission.status !== "pending") return;

  // 3. Insert into the games table
  const { data: newGame, error: insertError } = await supabase
    .from("games")
    .insert({
      name: submission.name,
      subtitle: submission.subtitle,
      sport: submission.sport,
      year: submission.year,
      type: submission.type,
      description: submission.description,
      players: submission.players,
      playtime: submission.playtime,
      complexity: submission.complexity,
      publisher_name: submission.publisher_name,
      publisher_website: submission.publisher_website,
      bgg_url: submission.bgg_url,
      image_url: submission.image_url,
      source: "manual",
    })
    .select("id")
    .single();

  if (insertError || !newGame) {
    console.error("Failed to insert game:", insertError);
    return;
  }

  // 4. Mark submission as approved + link to new game
  await supabase
    .from("game_submissions")
    .update({ status: "approved", approved_game_id: newGame.id })
    .eq("id", id);

  // 5. Revalidate affected paths
  revalidatePath("/admin/games");
  revalidatePath("/admin");
  revalidatePath("/games");
  revalidatePath("/recent");
}

async function rejectSubmission(id: number) {
  "use server";
  const supabase = await createClient();
  await supabase
    .from("game_submissions")
    .update({ status: "rejected" })
    .eq("id", id);
  revalidatePath("/admin/games");
  revalidatePath("/admin");
}

async function updateSubmission(
  id: number,
  data: Partial<GameSubmission>
): Promise<{ error?: string }> {
  "use server";
  // Only allow updating game-related fields
  const allowed: (keyof GameSubmission)[] = [
    "name",
    "subtitle",
    "sport",
    "year",
    "type",
    "complexity",
    "players",
    "playtime",
    "description",
    "publisher_name",
    "publisher_website",
    "bgg_url",
    "image_url",
  ];
  const sanitized: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) {
      sanitized[key] = data[key];
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("game_submissions")
    .update(sanitized)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/games");
  return {};
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

function StatusBadge({ status }: { status: GameSubmission["status"] }) {
  const styles: Record<GameSubmission["status"], { bg: string; color: string; border: string }> = {
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

export default async function AdminGamesPage() {
  const supabase = await createClient();

  const { data, count } = await supabase
    .from("game_submissions")
    .select("*", { count: "exact" })
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const submissions: GameSubmission[] = (data ?? []) as GameSubmission[];
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
              Game Submissions
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
              {total === 1 ? "submission" : "submissions"} awaiting review
            </p>
          </div>
          <div
            className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
            style={{ background: "rgba(212,168,67,0.1)" }}
          >
            <Gamepad2 size={20} style={{ color: "var(--raw-gold-450)" }} />
          </div>
        </div>

        {/* Empty state */}
        {submissions.length === 0 ? (
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
                No pending game submissions at this time.
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
            {/* Gold top accent */}
            <div
              className="h-0.5"
              style={{ background: "var(--color-accent-primary)" }}
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
                      "Name",
                      "Sport",
                      "Year",
                      "Submitter",
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
                  {submissions.map((sub, idx) => (
                    <tr
                      key={sub.id}
                      style={{
                        borderBottom:
                          idx < submissions.length - 1
                            ? "1px solid var(--color-border-faint)"
                            : "none",
                        background:
                          idx % 2 === 1
                            ? "rgba(255,255,255,0.015)"
                            : "transparent",
                      }}
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div
                          className="font-heading font-semibold text-sm leading-snug"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {sub.name}
                        </div>
                        {sub.subtitle && (
                          <div
                            className="text-xs mt-0.5 leading-snug line-clamp-1"
                            style={{ color: "var(--color-text-faint)" }}
                          >
                            {sub.subtitle}
                          </div>
                        )}
                      </td>

                      {/* Sport */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sub.sport ? (
                          <span className="sport-badge">{sub.sport}</span>
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: "var(--color-text-faint)" }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Year */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="font-mono text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {sub.year ?? "—"}
                        </span>
                      </td>

                      {/* Submitter */}
                      <td className="px-4 py-3">
                        <div
                          className="text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {sub.submitter_name ?? (
                            <span
                              style={{ color: "var(--color-text-faint)" }}
                            >
                              Anonymous
                            </span>
                          )}
                        </div>
                        {sub.submitter_email && (
                          <div
                            className="text-xs mt-0.5 font-mono truncate max-w-[160px]"
                            style={{ color: "var(--color-text-faint)" }}
                          >
                            {sub.submitter_email}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--color-text-faint)" }}
                        >
                          {formatDate(sub.created_at)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={sub.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <SubmissionActions
                          submission={sub}
                          approveAction={approveSubmission}
                          rejectAction={rejectSubmission}
                          updateAction={updateSubmission}
                        />
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
                {total} pending {total === 1 ? "submission" : "submissions"}
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
