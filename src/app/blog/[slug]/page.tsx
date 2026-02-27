import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getBlogPost, getBlogPostComments } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import { BlogBody } from "@/lib/blog-renderer";
import { CommentsSection } from "@/components/detail/CommentsSection";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: `Not Found — ${SITE_NAME}` };
  return {
    title: `${post.title} — ${SITE_NAME}`,
    description: post.excerpt ?? post.body.slice(0, 160),
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  const comments = await getBlogPostComments(post.id);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-base)" }}
    >
      {/* Hero image */}
      {post.image_url && (
        <div
          className="relative w-full"
          style={{ maxHeight: "420px", overflow: "hidden" }}
        >
          <Image
            src={post.image_url}
            alt={post.title}
            width={1200}
            height={420}
            className="w-full object-cover"
            style={{ maxHeight: "420px" }}
            unoptimized
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, var(--color-bg-base) 0%, transparent 50%)",
            }}
          />
        </div>
      )}

      <article className="max-w-[760px] mx-auto px-5 py-12">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors"
          style={{ color: "var(--color-text-link)" }}
        >
          <ArrowLeft size={14} />
          All posts
        </Link>

        {/* Title */}
        <h1
          className="font-heading font-bold text-3xl md:text-4xl uppercase tracking-wide mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          {post.title}
        </h1>

        {/* Date */}
        <p
          className="text-sm font-mono mb-10"
          style={{ color: "var(--color-text-faint)" }}
        >
          {formatDate(post.published_at ?? post.created_at)}
        </p>

        {/* Body */}
        <BlogBody body={post.body} />

        {/* Comments */}
        <div
          className="mt-12 pt-8"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <Suspense fallback={null}>
            <CommentsSection comments={comments} blogPostId={post.id} />
          </Suspense>
        </div>

        {/* Footer */}
        <div
          className="mt-12 pt-8"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "var(--color-text-link)" }}
          >
            <ArrowLeft size={14} />
            Back to all posts
          </Link>
        </div>
      </article>
    </div>
  );
}
