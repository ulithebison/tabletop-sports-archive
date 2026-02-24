"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTeamStore } from "@/lib/fdf/stores/team-store";
import { TeamForm } from "@/components/fdf/teams/TeamForm";

export default function EditTeamPage() {
  const params = useParams();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const team = useTeamStore((s) => s.getTeam(params.id as string));

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && !team) {
      router.push("/fdf/teams");
    }
  }, [hydrated, team, router]);

  if (!hydrated) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-8 w-48 rounded animate-pulse mb-6" style={{ backgroundColor: "var(--fdf-bg-card)" }} />
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div>
      <h1
        className="text-2xl font-bold font-fdf-mono mb-6"
        style={{ color: "var(--fdf-text-primary)" }}
      >
        Edit Team
      </h1>
      <TeamForm existingTeam={team} />
    </div>
  );
}
