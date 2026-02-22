import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export const revalidate = 3600;

export const metadata = {
  title: `About — ${SITE_NAME}`,
  description:
    "Why the Tabletop Sports Games Archive exists, how it works, and how you can help grow the collection.",
};

export default function AboutPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-base)" }}
    >
      <section className="max-w-[800px] mx-auto px-5 py-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="accent-rule" />
          <span className="section-label">About</span>
        </div>
        <h1
          className="font-heading font-bold text-4xl uppercase tracking-wide mb-10"
          style={{ color: "var(--color-text-primary)" }}
        >
          Why This Archive Exists
        </h1>

        {/* Body */}
        <div className="space-y-6" style={{ fontFamily: "var(--font-lora)" }}>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Sports tabletop games have been around for well over a century.
            Baseball dice games from the 1900s, football strategy boards from
            the 1960s, cricket card games printed in someone&rsquo;s garage
            &mdash; thousands of these games exist, scattered across dozens of
            sports, and there has never been one place to find them all.
          </p>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            That&rsquo;s the gap this archive fills. We started by pulling data
            from BoardGameGeek &mdash; the best general-purpose board game
            database out there &mdash; and filtering it down to sports-related
            titles. That gave us a solid foundation of over 6,800 games. But BGG
            doesn&rsquo;t cover everything, especially smaller indie releases,
            print-and-play designs, and games from outside the US and Europe.
          </p>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            That&rsquo;s where you come in.
          </p>

          {/* Highlight box */}
          <div
            className="rounded-lg p-6 my-8"
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
              If you know a sports tabletop game that isn&rsquo;t in the archive
              &mdash; something your family plays, a local favorite, an indie
              release, a game from another country &mdash; submit it. Every game
              matters here, whether it&rsquo;s a slick modern production or a
              photocopied sheet from 1987.
            </p>
          </div>

          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Beyond cataloging, we want this to be a place where fans actually
            talk about these games. Rate the ones you&rsquo;ve played. Write a
            review. Help someone who&rsquo;s looking for a good two-player
            baseball game or a solo hockey sim find their next favorite.
          </p>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            This is a passion project. There are no ads, no paywalls, no
            sponsored rankings. Just a growing database maintained by people who
            think sports tabletop games deserve better than being buried in the
            back pages of general-purpose sites.
          </p>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Thanks for being here. If you want to help, the easiest things you
            can do are submit a game we&rsquo;re missing or leave a review on one
            you&rsquo;ve played.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 mt-10">
          <Link
            href="/submit/game"
            className="inline-flex items-center gap-2 px-6 py-3 rounded font-heading font-semibold text-sm uppercase tracking-wider transition-all"
            style={{
              background: "var(--raw-gold-450)",
              color: "var(--raw-black)",
            }}
          >
            Submit a Game <ArrowRight size={16} />
          </Link>
          <Link
            href="/games"
            className="inline-flex items-center gap-2 px-6 py-3 rounded font-heading font-semibold text-sm uppercase tracking-wider transition-all border"
            style={{
              background: "transparent",
              borderColor: "var(--color-border-default)",
              color: "var(--color-text-secondary)",
            }}
          >
            Browse the Archive
          </Link>
        </div>
      </section>
    </div>
  );
}
