"use client";

import type { FdfTeam } from "@/lib/fdf/types";
import { TeamCard } from "./TeamCard";

interface TeamListProps {
  teams: FdfTeam[];
}

export function TeamList({ teams }: TeamListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
