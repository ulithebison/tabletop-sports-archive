"use client";

import { TeamForm } from "@/components/fdf/teams/TeamForm";

export default function NewTeamPage() {
  return (
    <div>
      <h1
        className="text-2xl font-bold font-fdf-mono mb-6"
        style={{ color: "var(--fdf-text-primary)" }}
      >
        Create Team
      </h1>
      <TeamForm />
    </div>
  );
}
