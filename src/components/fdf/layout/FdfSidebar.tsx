"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Zap, Users, History, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/fdf", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/fdf/quick-game", label: "Quick Game", icon: Zap },
  { href: "/fdf/teams", label: "Teams", icon: Users },
  { href: "/fdf/history", label: "History", icon: History },
];

interface FdfSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function FdfSidebar({ open, onClose }: FdfSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 lg:z-0 h-screen w-56 flex-shrink-0 flex flex-col border-r transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          backgroundColor: "var(--fdf-bg-secondary)",
          borderColor: "var(--fdf-border)",
        }}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 h-14 lg:hidden">
          <span
            className="font-fdf-mono text-sm font-bold tracking-wider"
            style={{ color: "var(--fdf-accent)" }}
          >
            FDF
          </span>
          <button onClick={onClose} className="p-1" style={{ color: "var(--fdf-text-secondary)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Logo area */}
        <div className="hidden lg:flex items-center gap-2 px-4 h-14">
          <div
            className="w-7 h-7 rounded flex items-center justify-center font-fdf-mono text-xs font-bold"
            style={{ backgroundColor: "var(--fdf-accent)", color: "#fff" }}
          >
            FD
          </div>
          <span
            className="font-fdf-mono text-sm font-bold tracking-wider"
            style={{ color: "var(--fdf-text-primary)" }}
          >
            FDF Companion
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                )}
                style={{
                  color: active ? "#fff" : "var(--fdf-text-secondary)",
                  backgroundColor: active ? "rgba(59,130,246,0.15)" : "transparent",
                  borderLeft: active ? "3px solid var(--fdf-accent)" : "3px solid transparent",
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
