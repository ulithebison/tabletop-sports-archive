"use client";

import { useRouter } from "next/navigation";
import { ClassicSetupWizard } from "@/components/fdf/commissioner/ClassicSetupWizard";

export default function CommissionerSetupPage() {
  const router = useRouter();

  return (
    <div className="py-4">
      <ClassicSetupWizard
        onComplete={(leagueId) => router.replace(`/fdf/commissioner/${leagueId}`)}
        onCancel={() => router.push("/fdf/commissioner")}
      />
    </div>
  );
}
