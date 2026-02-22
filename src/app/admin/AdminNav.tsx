"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, LayoutDashboard, Gamepad2, Star, MessageCircle, Newspaper, BookOpen } from "lucide-react";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/games", label: "Game Submissions", icon: Gamepad2, exact: false },
  { href: "/admin/reviews", label: "Reviews", icon: Star, exact: false },
  { href: "/admin/comments", label: "Comments", icon: MessageCircle, exact: false },
  { href: "/admin/news", label: "News", icon: Newspaper, exact: false },
  { href: "/admin/blog", label: "Blog", icon: BookOpen, exact: false },
];

interface AdminNavProps {
  userEmail: string | null;
}

export function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "var(--color-bg-nav)",
        borderColor: "var(--color-border-subtle)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-5 h-14 flex items-center gap-6">
        {/* Logo mark */}
        <Link
          href="/admin"
          className="flex items-center gap-2.5 flex-shrink-0 group"
        >
          <div
            className="w-7 h-7 flex items-center justify-center rounded text-xs font-heading font-bold"
            style={{ background: "var(--raw-gold-450)", color: "var(--raw-black)", letterSpacing: "0.05em" }}
          >
            TS
          </div>
          <div className="hidden sm:block">
            <div
              className="font-heading font-bold text-xs leading-none uppercase tracking-widest"
              style={{ color: "var(--color-text-accent)" }}
            >
              Press Box Admin
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 flex-1">
          {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-medium uppercase tracking-wide transition-colors"
                style={{
                  color: active
                    ? "var(--color-text-accent)"
                    : "var(--color-text-muted)",
                  background: active ? "rgba(212,168,67,0.08)" : "transparent",
                }}
              >
                <Icon size={13} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: user email + sign out */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          {userEmail && (
            <span
              className="hidden sm:block text-xs font-mono truncate max-w-[180px]"
              style={{ color: "var(--color-text-faint)" }}
            >
              {userEmail}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-medium uppercase tracking-wide transition-colors"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--raw-red-300)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--color-text-muted)";
            }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
