import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export const revalidate = 3600;

export const metadata = {
  title: `Terms of Use — ${SITE_NAME}`,
  description:
    "Terms and conditions for using the Tabletop Sports Games Archive.",
};

export default function TermsPage() {
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
          Terms of Use
        </h1>

        {/* Body */}
        <div className="space-y-8" style={{ fontFamily: "var(--font-lora)" }}>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-faint)" }}
          >
            Last updated: February 2026
          </p>

          {/* Acceptance */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Acceptance of Terms
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              By accessing or using the Tabletop Sports Games Archive
              (&ldquo;the Site&rdquo;), you agree to be bound by these Terms
              of Use. If you do not agree, please do not use the Site.
            </p>
          </div>

          {/* User Content */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              User Content
            </h2>
            <div className="space-y-3">
              <p
                className="text-base leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                You may submit reviews, game submissions, comments, and ratings
                through the Site. By submitting content, you:
              </p>
              <ul
                className="list-disc pl-6 space-y-2 text-base leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <li>
                  Confirm that your submission is your own work and does not
                  violate any third-party rights.
                </li>
                <li>
                  Grant us a non-exclusive, royalty-free, worldwide license to
                  display, reproduce, and distribute your content on the Site.
                </li>
                <li>
                  Understand that all user-submitted content is moderated before
                  it appears publicly. We reserve the right to reject, edit, or
                  remove any submission.
                </li>
              </ul>
            </div>
          </div>

          {/* Game Data Attribution */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Game Data &amp; Attribution
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              A significant portion of game data displayed on this Site is
              sourced from{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                BoardGameGeek (BGG)
              </strong>
              . Game names, descriptions, images, and statistics are the property
              of their respective owners and are used here for informational and
              archival purposes.
            </p>
          </div>

          {/* Prohibited Use */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Prohibited Use
            </h2>
            <p
              className="text-base leading-relaxed mb-3"
              style={{ color: "var(--color-text-secondary)" }}
            >
              You agree not to:
            </p>
            <ul
              className="list-disc pl-6 space-y-2 text-base leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <li>
                Scrape, crawl, or systematically download data from the Site
                for commercial purposes without prior written consent.
              </li>
              <li>
                Submit false, misleading, or spam content through any form.
              </li>
              <li>
                Attempt to gain unauthorized access to the Site&rsquo;s systems
                or administrative areas.
              </li>
              <li>
                Use the Site in any way that could damage, disable, or impair
                its functionality.
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Disclaimer
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              The Site is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, express or
              implied. We do not guarantee the accuracy, completeness, or
              availability of any information on the Site. Game data may be
              incomplete or outdated.
            </p>
          </div>

          {/* Changes */}
          <div>
            <h2
              className="font-heading font-bold text-xl uppercase tracking-wide mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Changes to These Terms
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              We may update these Terms from time to time. Continued use of the
              Site after changes are posted constitutes acceptance of the revised
              Terms. We encourage you to review this page periodically.
            </p>
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
              Questions about these terms?{" "}
              <Link
                href="/contact"
                style={{ color: "var(--color-text-link)" }}
              >
                Contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
