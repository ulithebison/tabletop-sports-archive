"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { SeasonForm } from "@/components/fdf/seasons/SeasonForm";
import type { Division } from "@/lib/fdf/types";

export default function NewSeasonPage() {
  const searchParams = useSearchParams();

  const { initialTeamIds, initialDivisions } = useMemo(() => {
    const teamsParam = searchParams.get("teams");
    const divisionsParam = searchParams.get("divisions");

    let teamIds: string[] | undefined;
    let divisions: Division[] | undefined;

    if (teamsParam) {
      teamIds = teamsParam.split(",").filter(Boolean);
    }
    if (divisionsParam) {
      try {
        divisions = JSON.parse(divisionsParam);
      } catch {
        // ignore invalid JSON
      }
    }

    return { initialTeamIds: teamIds, initialDivisions: divisions };
  }, [searchParams]);

  return (
    <div>
      <h1
        className="text-2xl font-bold font-fdf-mono mb-6"
        style={{ color: "var(--fdf-text-primary)" }}
      >
        Create Season
      </h1>
      <SeasonForm
        initialTeamIds={initialTeamIds}
        initialDivisions={initialDivisions}
      />
    </div>
  );
}
