import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { NewsItem } from "@/lib/types";
import { Newspaper, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "News",
};

// ----------------------------------------------------------------
// Server Actions
// ----------------------------------------------------------------

async function createNews(formData: FormData) {
  "use server";
  const title = formData.get("title") as string | null;
  const body = formData.get("body") as string | null;

  if (!title?.trim() || !body?.trim()) return;

  const supabase = await createClient();
  await supabase.from("news").insert({
    title: title.trim(),
    body: body.trim(),
  });

  revalidatePath("/admin/news");
  revalidatePath("/admin");
  revalidatePath("/");
}

async function deleteNews(id: number) {
  "use server";
  const supabase = await createClient();
  await supabase.from("news").delete().eq("id", id);
  revalidatePath("/admin/news");
  revalidatePath("/admin");
  revalidatePath("/");
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

export default async function AdminNewsPage() {
  const supabase = await createClient();

  const { data, count } = await supabase
    .from("news")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  const news: NewsItem[] = (data ?? []) as NewsItem[];
  const total = count ?? 0;

  return (
    <div
      className="min-h-screen px-5 py-10"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div className="max-w-[1000px] mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="accent-rule" />
              <span className="section-label">Content</span>
            </div>
            <h1
              className="font-heading font-bold text-3xl uppercase tracking-wide"
              style={{ color: "var(--color-text-primary)" }}
            >
              News
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
              {total === 1 ? "article" : "articles"} published
            </p>
          </div>
          <div
            className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
            style={{ background: "rgba(77,132,100,0.1)" }}
          >
            <Newspaper size={20} style={{ color: "var(--raw-green-300)" }} />
          </div>
        </div>

        {/* Create form */}
        <form
          action={createNews}
          className="rounded-lg p-6 mb-8"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <h2
            className="font-heading font-semibold text-base uppercase tracking-widest mb-5"
            style={{ color: "var(--color-text-accent)" }}
          >
            Create News Item
          </h2>
          <div className="flex flex-col gap-3">
            <input
              name="title"
              required
              placeholder="Headline"
              maxLength={200}
              className="h-10 px-3 rounded text-sm outline-none"
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-input)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
              }}
            />
            <textarea
              name="body"
              required
              placeholder="Write the news body..."
              rows={4}
              className="px-3 py-2 rounded text-sm outline-none resize-y"
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-input)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-lora)",
              }}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded text-sm font-heading font-semibold uppercase tracking-wider transition-colors"
                style={{
                  background: "var(--raw-gold-450)",
                  color: "var(--raw-black)",
                }}
              >
                <Newspaper size={14} />
                Publish
              </button>
            </div>
          </div>
        </form>

        {/* News list */}
        {news.length === 0 ? (
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
                No news yet
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-text-faint)" }}
              >
                Use the form above to create your first announcement.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            {/* Green top accent */}
            <div
              className="h-0.5"
              style={{ background: "var(--raw-green-300)" }}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    {["Title", "Body", "Date", "Actions"].map((col) => (
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
                  {news.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom:
                          idx < news.length - 1
                            ? "1px solid var(--color-border-faint)"
                            : "none",
                        background:
                          idx % 2 === 1
                            ? "rgba(255,255,255,0.015)"
                            : "transparent",
                      }}
                    >
                      {/* Title */}
                      <td className="px-4 py-3">
                        <div
                          className="font-heading font-semibold text-sm"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {item.title}
                        </div>
                      </td>

                      {/* Body excerpt */}
                      <td className="px-4 py-3 max-w-sm">
                        <p
                          className="text-xs leading-relaxed line-clamp-2"
                          style={{
                            color: "var(--color-text-muted)",
                            fontFamily: "var(--font-lora)",
                          }}
                        >
                          {item.body}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--color-text-faint)" }}
                        >
                          {formatDate(item.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <form
                          action={async () => {
                            "use server";
                            await deleteNews(item.id);
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
                {total} {total === 1 ? "article" : "articles"}
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
