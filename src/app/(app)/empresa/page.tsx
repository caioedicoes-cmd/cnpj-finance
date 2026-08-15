import { createClient } from "@/lib/supabase/server";
import { EmpresaForm } from "./EmpresaForm";

export default async function EmpresaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Empresa
        </p>
        <h1 className="font-display text-2xl text-ink">
          {company ? "Dados da empresa" : "Vamos cadastrar sua empresa"}
        </h1>
        {!company && (
          <p className="mt-1 text-sm text-ink-muted">
            Antes de começar a registrar receitas e despesas, informe os dados do seu CNPJ.
          </p>
        )}
      </header>
      <EmpresaForm company={company} />
    </div>
  );
}
