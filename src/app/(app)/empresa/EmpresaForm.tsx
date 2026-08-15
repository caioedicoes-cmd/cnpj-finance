"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Company } from "@/lib/types";

function formatCNPJ(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function EmpresaForm({ company }: { company: Company | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [nome, setNome] = useState(company?.nome ?? "");
  const [nomeFantasia, setNomeFantasia] = useState(company?.nome_fantasia ?? "");
  const [cnpj, setCnpj] = useState(company?.cnpj ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("EmpresaForm: current user:", user);
    if (!user) {
      setLoading(false);
      setError("Usuário não autenticado. Faça login novamente.");
      return;
    }

    const payload = { nome, nome_fantasia: nomeFantasia || null, cnpj, user_id: user.id };

    const { error } = company
      ? await supabase.from("companies").update(payload).eq("id", company.id)
      : await supabase.from("companies").insert(payload);

    setLoading(false);

    if (error) {
      console.error("Supabase error saving company:", error);
      const details = [error.message, error.details, error.hint].filter(Boolean).join(" — ");
      setError(details || "Não foi possível salvar. Verifique os dados e tente novamente.");
      return;
    }

    if (!company) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md rounded-2xl border border-line bg-paper-raised p-6 space-y-4"
    >
      <Field label="Nome da empresa (razão social)">
        <Input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Everton Designer Serviços Digitais LTDA"
        />
      </Field>
      <Field label="Nome fantasia">
        <Input
          value={nomeFantasia}
          onChange={(e) => setNomeFantasia(e.target.value)}
          placeholder="Ex: Everton Designer"
        />
      </Field>
      <Field label="CNPJ">
        <Input
          required
          value={cnpj}
          onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
        />
      </Field>
      {error && (
        <p className="rounded-lg bg-negative-tint px-3 py-2 text-sm text-negative">{error}</p>
      )}
      {saved && (
        <p className="rounded-lg bg-positive-tint px-3 py-2 text-sm text-positive">
          Dados atualizados.
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Salvando…" : company ? "Salvar alterações" : "Cadastrar empresa"}
      </Button>
    </form>
  );
}
