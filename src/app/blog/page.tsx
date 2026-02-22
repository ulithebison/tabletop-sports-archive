import Link from "next/link";
import Image from "next/image";
import { getBlogPosts } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import { BookOpen, Inbox } from "lucide-react";
import type { BlogPost } from "@/lib/types";

export const revalidate = 3600;

export const metadata = {
  title: `Blog — ${SITE_NAME}`,
  description:
    "Game reviews, deep dives, and updates from the Tabletop Sports Games Archive.",
};

export default async function BlogPage() {
  let posts: BlogPost[] = [];
  try {
    posts = await getBlogPosts();
  } catch {
    // fail gracefully
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-base)" }}
    >
      <section className="max-w-[1000px] mx-auto px-5 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="accent-rule" />
          <span className="section-label">Writing</span>
        </div>
        <h1
          className="font-heading font-bold text-4xl uppercase tracking-wide mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          Blog
        </h1>
        <p
          className="text-sm mb-10"
          style={{ color: "var(--color-text-muted)" }}
        >
          Game reviews, deep dives, and updates from the archive.
        </p>

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
                No posts yet
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-text-faint)" }}
              >
                Check back soon for game reviews and archive updates.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-lg overflow-hidden transition-colors"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                {/* Featured image */}
                {post.image_url ? (
                  <div className="relative w-full" style={{ height: "200px" }}>
                    <Image
                      src={post.image_url}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className="w-full flex items-center justify-center"
                    style={{
                      height: "120px",
                      background: "rgba(212,168,67,0.05)",
                    }}
                  >
                    <BookOpen
                      size={32}
                      style={{ color: "var(--color-text-faint)", opacity: 0.3 }}
                    />
                  </div>
                )}

                <div className="p-5">
                  <h2
                    className="font-heading font-bold text-lg uppercase tracking-wide mb-2 group-hover:text-gold-400 transition-colors"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p
                      className="text-sm leading-relaxed line-clamp-3 mb-3"
                      style={{
                        color: "var(--color-text-muted)",
                        fontFamily: "var(--font-lora)",
                      }}
                    >
                      {post.excerpt}
                    </p>
                  )}
                  <p
                    className="text-xs font-mono"
                    style={{ color: "var(--color-text-faint)" }}
                  >
                    {formatDate(post.published_at ?? post.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
