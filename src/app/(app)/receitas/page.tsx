import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LancamentosManager } from "@/components/LancamentosManager";

export default async function ReceitasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (!company) redirect("/empresa");

  const [{ data: categories }, { data: revenues }] = await Promise.all([
    supabase.from("categories").select("*").eq("company_id", company.id).eq("type", "revenue").order("name"),
    supabase.from("revenues").select("*").eq("company_id", company.id),
  ]);

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Entradas</p>
        <h1 className="font-display text-2xl text-ink">Receitas</h1>
      </header>
      <LancamentosManager
        kind="revenue"
        companyId={company.id}
        categories={categories ?? []}
        initialItems={revenues ?? []}
      />
    </div>
  );
}
