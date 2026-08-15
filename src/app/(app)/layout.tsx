import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: company } = await supabase
    .from("companies")
    .select("id, nome_fantasia")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col bg-paper sm:flex-row">
      <Sidebar nomeFantasia={company?.nome_fantasia ?? ""} />
      <main className="flex-1 min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
