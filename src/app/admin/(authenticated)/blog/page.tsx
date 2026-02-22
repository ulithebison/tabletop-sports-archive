import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BlogPost } from "@/lib/types";
import { BookOpen, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog",
};

// ----------------------------------------------------------------
// Server Actions
// ----------------------------------------------------------------

async function createPost(formData: FormData) {
  "use server";
  const title = formData.get("title") as string | null;
  const slug = formData.get("slug") as string | null;
  const excerpt = formData.get("excerpt") as string | null;
  const image_url = formData.get("image_url") as string | null;
  const body = formData.get("body") as string | null;
  const status = formData.get("status") as string | null;

  if (!title?.trim() || !slug?.trim() || !body?.trim()) return;

  const supabase = await createClient();
  await supabase.from("blog_posts").insert({
    title: title.trim(),
    slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
    body: body.trim(),
    excerpt: excerpt?.trim() || null,
    image_url: image_url?.trim() || null,
    status: status === "published" ? "published" : "draft",
    published_at: status === "published" ? new Date().toISOString() : null,
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");
}

async function updatePostStatus(id: number, newStatus: "draft" | "published") {
  "use server";
  const supabase = await createClient();
  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === "published") {
    updates.published_at = new Date().toISOString();
  }
  await supabase.from("blog_posts").update(updates).eq("id", id);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");
}

async function deletePost(id: number) {
  "use server";
  const supabase = await createClient();
  await supabase.from("blog_posts").delete().eq("id", id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
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

export default async function AdminBlogPage() {
  const supabase = await createClient();

  const { data, count } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  const posts: BlogPost[] = (data ?? []) as BlogPost[];
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
              Blog Posts
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
              {total === 1 ? "post" : "posts"} total
            </p>
          </div>
          <div
            className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
            style={{ background: "rgba(74,132,184,0.1)" }}
          >
            <BookOpen size={20} style={{ color: "var(--raw-blue-400)" }} />
          </div>
        </div>

        {/* Create form */}
        <form
          action={createPost}
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
            Create Blog Post
          </h2>
          <div className="flex flex-col gap-3">
            {/* Title */}
            <input
              name="title"
              required
              placeholder="Post title"
              maxLength={300}
              className="h-10 px-3 rounded text-sm outline-none"
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-input)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
              }}
            />

            {/* Slug */}
            <input
              name="slug"
              required
              placeholder="url-slug (auto-generated from title or edit manually)"
              maxLength={300}
              className="h-10 px-3 rounded text-sm outline-none font-mono"
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-input)",
                color: "var(--color-text-secondary)",
              }}
            />

            {/* Excerpt */}
            <input
              name="excerpt"
              placeholder="Short excerpt (optional, shown on blog listing)"
              maxLength={500}
              className="h-10 px-3 rounded text-sm outline-none"
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-input)",
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-lora)",
              }}
            />

            {/* Featured image URL */}
            <input
              name="image_url"
              placeholder="Featured image URL (optional)"
              maxLength={2000}
              className="h-10 px-3 rounded text-sm outline-none font-mono"
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-input)",
                color: "var(--color-text-secondary)",
              }}
            />

            {/* Body */}
            <textarea
              name="body"
              required
              placeholder="Write the post body... (Double-newline for paragraphs. Supports **bold**, *italic*, [links](url), and ![alt](image-url).)"
              rows={10}
              className="px-3 py-2 rounded text-sm outline-none resize-y"
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border-input)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-lora)",
              }}
            />

            {/* Status + submit */}
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                <select
                  name="status"
                  className="h-9 px-3 rounded text-sm outline-none"
                  style={{
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border-input)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded text-sm font-heading font-semibold uppercase tracking-wider transition-colors"
                style={{
                  background: "var(--raw-gold-450)",
                  color: "var(--raw-black)",
                }}
              >
                <BookOpen size={14} />
                Create Post
              </button>
            </div>
          </div>
        </form>

        {/* Posts list */}
        {posts.length === 0 ? (
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
                No blog posts yet
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-text-faint)" }}
              >
                Use the form above to create your first post.
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
                    {["Title", "Excerpt", "Status", "Date", "Actions"].map((col) => (
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
                  {posts.map((post, idx) => (
                    <tr
                      key={post.id}
                      style={{
                        borderBottom:
                          idx < posts.length - 1
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
                          {post.title}
                        </div>
                        <div
                          className="text-xs font-mono mt-0.5"
                          style={{ color: "var(--color-text-faint)" }}
                        >
                          /blog/{post.slug}
                        </div>
                      </td>

                      {/* Excerpt */}
                      <td className="px-4 py-3 max-w-xs">
                        <p
                          className="text-xs leading-relaxed line-clamp-2"
                          style={{
                            color: "var(--color-text-muted)",
                            fontFamily: "var(--font-lora)",
                          }}
                        >
                          {post.excerpt || "—"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-heading font-semibold uppercase tracking-wide"
                          style={{
                            background:
                              post.status === "published"
                                ? "rgba(77,132,100,0.12)"
                                : "rgba(212,168,67,0.12)",
                            border:
                              post.status === "published"
                                ? "1px solid rgba(77,132,100,0.3)"
                                : "1px solid rgba(212,168,67,0.3)",
                            color:
                              post.status === "published"
                                ? "var(--raw-green-300)"
                                : "var(--raw-gold-450)",
                          }}
                        >
                          {post.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--color-text-faint)" }}
                        >
                          {formatDate(post.published_at ?? post.created_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* Toggle publish/draft */}
                          <form
                            action={async () => {
                              "use server";
                              const newStatus = post.status === "published" ? "draft" : "published";
                              await updatePostStatus(post.id, newStatus);
                            }}
                          >
                            <button
                              type="submit"
                              className="px-3 py-1 rounded text-xs font-heading font-semibold uppercase tracking-wide transition-all"
                              style={{
                                background:
                                  post.status === "published"
                                    ? "rgba(212,168,67,0.12)"
                                    : "rgba(77,132,100,0.12)",
                                border:
                                  post.status === "published"
                                    ? "1px solid rgba(212,168,67,0.3)"
                                    : "1px solid rgba(77,132,100,0.3)",
                                color:
                                  post.status === "published"
                                    ? "var(--raw-gold-450)"
                                    : "var(--raw-green-300)",
                              }}
                            >
                              {post.status === "published" ? "Unpublish" : "Publish"}
                            </button>
                          </form>

                          {/* Delete */}
                          <form
                            action={async () => {
                              "use server";
                              await deletePost(post.id);
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
                {total} {total === 1 ? "post" : "posts"}
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
