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

// Extrai uma mensagem legível de qualquer formato de erro que possa chegar
// aqui (PostgrestError, Error nativo, AuthError, string, etc). Erros nativos
// do JS têm `message` como propriedade não-enumerável, então um simples
// `console.error(error)` ou `JSON.stringify(error)` pode mostrar "{}" mesmo
// quando o erro tem informação útil — por isso extraímos os campos na mão.
function describeError(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.name || "Erro desconhecido";
  if (typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    const parts = [anyErr.message, anyErr.details, anyErr.hint, anyErr.code]
      .filter((v) => typeof v === "string" && v.length > 0);
    if (parts.length > 0) return parts.join(" — ");
    try {
      const json = JSON.stringify(err, Object.getOwnPropertyNames(err));
      if (json && json !== "{}") return json;
    } catch {
      // ignore
    }
  }
  return "Erro desconhecido";
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

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Supabase error getting user:", describeError(userError), userError);
        setError("Usuário não autenticado. Faça login novamente.");
        return;
      }
      if (!user) {
        setError("Usuário não autenticado. Faça login novamente.");
        return;
      }

      const cnpjDigits = cnpj.replace(/\D/g, "");
      if (cnpjDigits.length !== 14) {
        setError("CNPJ inválido. Confira se os 14 dígitos foram preenchidos.");
        return;
      }

      const payload = { nome, nome_fantasia: nomeFantasia || null, cnpj, user_id: user.id };

      // .select().single() garante que recebemos de volta a linha salva (ou
      // um erro explícito) em vez de um sucesso silencioso quando o RLS
      // bloqueia a operação sem afetar nenhuma linha.
      const { data, error: saveError } = company
        ? await supabase
            .from("companies")
            .update(payload)
            .eq("id", company.id)
            .select()
            .single()
        : await supabase.from("companies").insert(payload).select().single();

      if (saveError) {
        console.error("Supabase error saving company:", describeError(saveError), saveError);
        setError(describeError(saveError) || "Não foi possível salvar. Verifique os dados e tente novamente.");
        return;
      }

      if (!data) {
        setError("Não foi possível confirmar o salvamento. Tente novamente.");
        return;
      }

      if (!company) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      // Captura falhas de rede/config (ex: variáveis de ambiente do Supabase
      // ausentes ou incorretas), que chegam como exceção e não como
      // `{ error }` no retorno do client.
      console.error("Unexpected error saving company:", describeError(err), err);
      setError(
        describeError(err) ||
          "Erro de conexão com o servidor. Verifique sua internet e tente novamente."
      );
    } finally {
      setLoading(false);
    }
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
