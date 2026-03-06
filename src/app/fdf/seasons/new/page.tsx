"use client";

import { SeasonForm } from "@/components/fdf/seasons/SeasonForm";

export default function NewSeasonPage() {
  return (
    <div>
      <h1
        className="text-2xl font-bold font-fdf-mono mb-6"
        style={{ color: "var(--fdf-text-primary)" }}
      >
        Create Season
      </h1>
      <SeasonForm />
    </div>
  );
}
