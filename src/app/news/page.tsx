import { getAllNews } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import { Newspaper, Inbox } from "lucide-react";
import { BlogBody } from "@/lib/blog-renderer";
import type { NewsItem } from "@/lib/types";

export const revalidate = 3600;

export const metadata = {
  title: `News — ${SITE_NAME}`,
  description: "The latest news and announcements from the Tabletop Sports Games Archive.",
};

export default async function NewsPage() {
  let news: NewsItem[] = [];
  try {
    news = await getAllNews();
  } catch {
    // fail gracefully
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-base)" }}
    >
      <section className="max-w-[900px] mx-auto px-5 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="accent-rule" />
          <span className="section-label">Archive Updates</span>
        </div>
        <h1
          className="font-heading font-bold text-4xl uppercase tracking-wide mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          News
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--color-text-muted)" }}>
          <span className="font-mono" style={{ color: "var(--color-text-accent)" }}>
            {news.length}
          </span>{" "}
          {news.length === 1 ? "update" : "updates"} posted
        </p>

        {news.length === 0 ? (
          <div
            className="rounded-lg flex flex-col items-center justify-center py-24 gap-4"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <Inbox size={48} style={{ color: "var(--color-text-faint)", opacity: 0.4 }} />
            <div className="text-center">
              <h2
                className="font-heading font-semibold text-lg uppercase tracking-wide"
                style={{ color: "var(--color-text-secondary)" }}
              >
                No news yet
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-faint)" }}>
                Check back soon for updates.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item) => (
              <article
                key={item.id}
                className="p-5 rounded-md"
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center mt-0.5"
                    style={{ background: "rgba(77,132,100,0.1)" }}
                  >
                    <Newspaper size={14} style={{ color: "var(--raw-green-300)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-heading font-semibold text-base mb-1.5"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {item.title}
                    </h3>
                    <div
                      className="text-sm leading-relaxed"
                      style={{
                        color: "var(--color-text-muted)",
                        fontFamily: "var(--font-lora)",
                      }}
                    >
                      <BlogBody body={item.body} />
                    </div>
                    <p
                      className="text-xs mt-3 font-mono"
                      style={{ color: "var(--color-text-faint)" }}
                    >
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
