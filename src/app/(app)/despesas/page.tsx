import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LancamentosManager } from "@/components/LancamentosManager";

export default async function DespesasPage() {
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

  const [{ data: categories }, { data: expenses }] = await Promise.all([
    supabase.from("categories").select("*").eq("company_id", company.id).eq("type", "expense").order("name"),
    supabase.from("expenses").select("*").eq("company_id", company.id),
  ]);

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Saídas</p>
        <h1 className="font-display text-2xl text-ink">Despesas</h1>
      </header>
      <LancamentosManager
        kind="expense"
        companyId={company.id}
        categories={categories ?? []}
        initialItems={expenses ?? []}
      />
    </div>
  );
}
