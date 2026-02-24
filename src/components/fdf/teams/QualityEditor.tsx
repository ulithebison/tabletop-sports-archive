"use client";

interface QualityOption {
  label: string;
  value: string;
}

interface QualityEditorProps {
  label: string;
  options: QualityOption[];
  value: string;
  onChange: (value: string) => void;
}

export function QualityEditor({ label, options, value, onChange }: QualityEditorProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <label
        className="text-sm font-medium whitespace-nowrap"
        style={{ color: "var(--fdf-text-secondary)" }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded px-2 py-1 text-sm font-fdf-mono min-w-[160px]"
        style={{
          backgroundColor: "var(--fdf-bg-elevated)",
          color: "var(--fdf-text-primary)",
          border: "1px solid var(--fdf-border)",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
