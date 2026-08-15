import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoriasManager } from "./CategoriasManager";

export default async function CategoriasPage() {
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

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("company_id", company.id)
    .order("type")
    .order("name");

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Organização</p>
        <h1 className="font-display text-2xl text-ink">Categorias</h1>
      </header>
      <CategoriasManager companyId={company.id} initialCategories={categories ?? []} />
    </div>
  );
}
