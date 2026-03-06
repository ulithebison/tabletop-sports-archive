"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  text: string;
  className?: string;
}

export function InfoTooltip({ text, className = "" }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex items-center justify-center w-4 h-4 rounded-full transition-colors"
        style={{
          backgroundColor: open ? "var(--fdf-accent)" : "rgba(59,130,246,0.2)",
          color: open ? "#fff" : "var(--fdf-accent)",
        }}
        type="button"
      >
        <Info size={10} />
      </button>
      {open && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 rounded-md text-xs leading-relaxed shadow-lg"
          style={{
            backgroundColor: "var(--fdf-bg-card)",
            border: "1px solid var(--fdf-accent)",
            color: "var(--fdf-text-secondary)",
          }}
        >
          {text}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 -mt-1"
            style={{ backgroundColor: "var(--fdf-bg-card)", borderRight: "1px solid var(--fdf-accent)", borderBottom: "1px solid var(--fdf-accent)" }}
          />
        </div>
      )}
    </div>
  );
}
