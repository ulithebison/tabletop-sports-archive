import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export const revalidate = 3600;

export const metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description:
    "How the Tabletop Sports Games Archive collects, stores, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-base)" }}
    >
      <section className="max-w-[800px] mx-auto px-5 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="accent-rule" />
          <span className="section-label">Legal</span>
        </div>
        <h1
          className="font-heading font-bold text-4xl uppercase tracking-wide mb-10"
          style={{ color: "var(--color-text-primary)" }}
        >
          Privacy Policy
        </h1>

        {/* Body */}
        <div className="space-y-8" style={{ fontFamily: "var(--font-lora)" }}>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-faint)" }}
          >
            Last updated: February 2026
          </p>

          {/* What We Collect */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              What We Collect
            </h2>
            <div className="space-y-3">
              <p
                className="text-base leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                We collect only what&rsquo;s needed to run the site:
              </p>
              <ul
                className="list-disc pl-6 space-y-2 text-base leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <li>
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    View counts
                  </strong>{" "}
                  &mdash; anonymous page-view counters per game, with no
                  personally identifiable information attached.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    Star ratings
                  </strong>{" "}
                  &mdash; a session-based identifier is used to prevent duplicate
                  votes. No account or login is required.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    Reviews
                  </strong>{" "}
                  &mdash; when you submit a review, we store the display name,
                  email address (optional), star rating, and review text you
                  provide. Reviews are moderated before they appear publicly.
                </li>
                <li>
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    Game submissions
                  </strong>{" "}
                  &mdash; when you submit a game, we store the game details and
                  your name and email (both optional). Submissions are moderated
                  before being added to the archive.
                </li>
              </ul>
            </div>
          </div>

          {/* Analytics */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Analytics
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              We use{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                Vercel Analytics
              </strong>{" "}
              and{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                Vercel Speed Insights
              </strong>
              , both of which are cookieless and privacy-focused. They collect
              aggregate page-view and performance data without tracking individual
              users. We do not use Google Analytics or any other third-party
              tracking service.
            </p>
          </div>

          {/* Cookies */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Cookies
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              This site uses a single httpOnly session cookie for rating and vote
              deduplication. It contains a random identifier with no personal
              information. We do not use tracking cookies, advertising cookies, or
              any third-party cookie-based services.
            </p>
          </div>

          {/* Data Storage */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Data Storage
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              All data is stored in a PostgreSQL database hosted by{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                Supabase
              </strong>{" "}
              (AWS infrastructure, US region). Data is encrypted at rest and in
              transit.
            </p>
          </div>

          {/* Third Parties */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Third-Party Services
            </h2>
            <ul
              className="list-disc pl-6 space-y-2 text-base leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <li>
                <strong style={{ color: "var(--color-text-primary)" }}>
                  BoardGameGeek
                </strong>{" "}
                &mdash; game data and images are sourced from BGG&rsquo;s public
                API and website.
              </li>
              <li>
                <strong style={{ color: "var(--color-text-primary)" }}>
                  Vercel
                </strong>{" "}
                &mdash; hosts the website and provides cookieless analytics.
              </li>
              <li>
                <strong style={{ color: "var(--color-text-primary)" }}>
                  Google Fonts
                </strong>{" "}
                &mdash; typefaces (Oswald, Inter, DM Mono, Lora) are loaded from
                Google&rsquo;s font CDN.
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div
            className="rounded-lg p-6 mt-8"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              borderLeft: "3px solid var(--raw-gold-450)",
            }}
          >
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-text-primary)" }}
            >
              Questions about your data?{" "}
              <Link
                href="/contact"
                style={{ color: "var(--color-text-link)" }}
              >
                Contact us
              </Link>{" "}
              and we&rsquo;ll be happy to help.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
