"use client";

interface FdfCardProps {
  children: React.ReactNode;
  className?: string;
}

export function FdfCard({ children, className = "" }: FdfCardProps) {
  return (
    <div
      className={`rounded-lg p-4 ${className}`}
      style={{
        backgroundColor: "var(--fdf-bg-card)",
        border: "1px solid var(--fdf-border)",
      }}
    >
      {children}
    </div>
  );
}
