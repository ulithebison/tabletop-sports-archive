import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "../AdminNav";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin — Tabletop Sports Games Archive",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-bg-base)" }}
    >
      <AdminNav userEmail={user.email ?? null} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
