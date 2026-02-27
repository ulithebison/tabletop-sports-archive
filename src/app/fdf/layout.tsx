"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { FdfSidebar } from "@/components/fdf/layout/FdfSidebar";
import { useSettingsStore } from "@/lib/fdf/stores/settings-store";

function useResolvedTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const [resolved, setResolved] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (theme !== "system") {
      setResolved(theme);
      return;
    }

    const mql = window.matchMedia("(prefers-color-scheme: light)");
    setResolved(mql.matches ? "light" : "dark");

    const handler = (e: MediaQueryListEvent) => {
      setResolved(e.matches ? "light" : "dark");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  return resolved;
}

export default function FdfLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const resolved = useResolvedTheme();
  const dataTheme = resolved === "light" ? "fdf-light" : "fdf";

  return (
    <div
      data-theme={dataTheme}
      className="flex min-h-[calc(100vh-60px)]"
      style={{ backgroundColor: "var(--fdf-bg-primary)", color: "var(--fdf-text-primary)" }}
    >
      <FdfSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with hamburger */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 h-12 border-b"
          style={{ borderColor: "var(--fdf-border)", backgroundColor: "var(--fdf-bg-secondary)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ color: "var(--fdf-text-secondary)" }}
          >
            <Menu size={20} />
          </button>
          <span
            className="font-fdf-mono text-sm font-bold tracking-wider"
            style={{ color: "var(--fdf-accent)" }}
          >
            FDF Companion
          </span>
        </div>

        <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
